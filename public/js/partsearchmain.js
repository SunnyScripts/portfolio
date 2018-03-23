/**
 * Created by Ryan Berg on 11/5/16.
 * rberg2@hotmail.com
 */

//TODO add clear comments

 // Major \\
//=========\\
//TODO missing prices
//TODO finish category info table. can we move it to its own file?
//TODO check the failed url list for possible solutions
//TODO allow user to put flipped words, ie pump water
//TODO there must be a better way to remove the drop-down than to wait 2 seconds, this doesn't really work!!!!!!
//TODO check valid quantity, copy cart page stepper code

 // Minor \\
//=========\\
//TODO get rid of overly complicated json object for sort
//TODO always have bottom grey bar on item boxes

 // Features \\
//============\\
//TODO add go-to page feature
//TODO add number of items in cart to icon

var pauseEvents = false;

var searchResultsContainer = document.getElementById("search-results-container");

var shoppingCart = [];
var numberOfItemsInCart = 0;

if(localStorage._shoppingCart)
{
    shoppingCart = JSON.parse(localStorage.getItem("_shoppingCart"));
    var cartSize = 0;
    for(var i = 0; i < shoppingCart.length; i++)
    {
        if(shoppingCart[i])
            cartSize++;
    }
    numberOfItemsInCart = cartSize;

}

var searchResults = {};

var currentSearchType = null;
var currentSearchValue = null;
var currentSearchCategoryType = null;
var currentSearchCategoryName = null;
var currentSortObject = {price:"asc"};

var currentFilters = [];
var currentFilterName = null;

var currentSearchPage = 1;

var topDivId = 0;
var bottomDivId = 12;
var lastScrollPosition = 0;

const categoryInfoTable = Object.freeze(
    {
       "Lights And Accessories":
       {
           subcategories:
           [
               "Beacons Strobes",
               "Bulbs",
               "Interior Lights",
               "Machine Head Lights",
               "Machine Signal Lights",
               "Machine Work Lights",
               "Reflectors Accessories",
               "Sealed Beam Lights"
           ]
       },
       "Tires":
       {
           subcategories:
           [
               "Construction Tread",
               "Off The Road",
               "Mounting Discs",
               "Smooth Tread"
           ]
       }
    });
const subcategoryInfoTable = Object.freeze(
    {
        "Beacons Strobes":
            {
                filterObjectsArray:
                    [
                        {
                            title: "Mounting Type",
                            attributes:
                                [
                                    "3-Bolt",
                                    "Magnetic",
                                    "2-Bolt"
                                ]
                        }
                    ]
            }
    });


function updateFilterTab(category)
{
    var filterObjectsArray = null;

    if(!categoryInfoTable[category])
    {
        if(activeCategory == category)
        {
            document.getElementById("subcategory-pusher").style.height = 0;
            isSubcategoryDropdownOpen = false;
            document.getElementById("search-results-container").style.height = "calc(100vh - 4.5vw)";
        }


        if(!subcategoryInfoTable[category])
        {
        }
        else
        {
            filterObjectsArray = subcategoryInfoTable[category].filterObjectsArray;
        }
    }
    else
    {
        if(categoryInfoTable[category].subcategories)
        {
            var subCategoryContainer = document.getElementById("subcategory-container");
            while (subCategoryContainer.firstChild)
            {
                subCategoryContainer.removeChild(subCategoryContainer.firstChild);
            }
            var subcategoryElementString = "";
            for(var i = 0; i < categoryInfoTable[category].subcategories.length; i++)
            {
                subcategoryElementString += '<li style="display:table-cell;" ><span class="subcategory-button">'+categoryInfoTable[category].subcategories[i]+'</span></li>';
            }
            subCategoryContainer.insertAdjacentHTML('beforeend', subcategoryElementString);

            document.getElementById("subcategory-pusher").style.height = "3.4vw";
            document.getElementById("search-results-container").style.height = "calc(100vh - 9.3vw)";
        }
        else
        {
            document.getElementById("subcategory-pusher").style.height = 0;
            isSubcategoryDropdownOpen = false;
            document.getElementById("search-results-container").style.height = "calc(100vh - 4.5vw)";
        }

        filterObjectsArray = categoryInfoTable[category].filterObjectsArray;
    }

    if(filterObjectsArray)
    {
        var filterString = "<div><div>";
        for(var i = 0; i < filterObjectsArray.length; i++)
        {
            filterString += '<div>'+filterObjectsArray[i].title+'</div>';
            for(var j = 0; j < filterObjectsArray[i].attributes.length; j++)
            {
                filterString += '<span id="'+filterObjectsArray[i].title+filterObjectsArray[i].attributes[j]+'" data-type="'+filterObjectsArray[i].title+'">'+filterObjectsArray[i].attributes[j]+'</span>'
            }
        }
        filterString += '</div></div>';
        var filterTabDropDown = document.getElementById("filter-tab-drop-down");
        while (filterTabDropDown.firstChild)
        {
            filterTabDropDown.removeChild(filterTabDropDown.firstChild);
        }
        filterTabDropDown.insertAdjacentHTML('beforeend', filterString);
        document.getElementById("filter-tab").style.width = "20%";
    }
    else
    {
        document.getElementById("filter-tab").style.width = 0;
        currentFilters = [];
    }
}

var activeCategory = null;

document.getElementById("subcategory-container").addEventListener("click", function(event)
{
    if(event.target.tagName == "SPAN")
    {
        if(event.target.style.backgroundColor == "")
        {
            currentSearchCategoryName = event.target.innerHTML;
            currentSearchCategoryType = "subcategory";

            var subCategoryChildren = document.getElementById("subcategory-container").childNodes;
            for(var i= 0; i < subCategoryChildren.length; i++)
            {
                if(subCategoryChildren[i].tagName == "LI")
                {
                    subCategoryChildren[i].firstElementChild.style.backgroundColor = "";
                }
            }
            event.target.style.backgroundColor = "#eeeeee";
            updateFilterTab(currentSearchCategoryName);
            updateSearch();
        }
        else
        {
            currentSearchCategoryName = activeCategory;
            currentSearchCategoryType = "category";
            event.target.style.backgroundColor = "";
            updateFilterTab(currentSearchCategoryName);
            updateSearch();
        }
    }
});

document.getElementById("sort-container").addEventListener("click", function(event)
{
    if(event.target.parentNode.id == "category")
    {
        clicked("category");
    }
    else if(event.target.parentNode.id == "sort-by")
    {
        clicked("sort-by");
    }
    else if(event.target.hasAttribute("data-type"))
    {
        pauseEvents = true;
        setTimeout(function()
        {
            pauseEvents = false;
        }, 1300);
        if(event.target.parentNode.parentNode.id != currentFilterName)
        {
            currentFilterName = event.target.parentNode.parentNode.id;
            currentFilters = [];
        }

        var filterName = event.target.getAttribute("data-type");
        var filterValue = event.target.innerHTML;

        for(var i = 0; i < currentFilters.length; i++)
        {
            if(event.target.classList.contains("active-detail") && currentFilters[i].filter_value == filterValue)
            {
                event.target.classList.remove("active-detail");
                currentFilters.splice(i, 1);
                updateSearch();
                return;
            }
            else if(currentFilters[i].filter_name == filterName)
            {
                document.getElementById(filterName+currentFilters[i].filter_value).classList.remove("active-detail");
                currentFilters.splice(i, 1);
            }
        }

        event.target.className = "active-detail";
        currentFilters.push({filter_name: filterName, filter_value: filterValue});
        updateSearch();
    }
    function clicked(idString)
    {
        pauseEvents = true;
        setTimeout(function()
        {
            pauseEvents = false;
        }, 1300);

        var listContainer = document.getElementById(idString);
        document.getElementById(idString+"-title").innerHTML = event.target.innerHTML;
        listContainer.classList.add("hidden");
        setTimeout(function(element)
        {
            element.classList.remove("hidden");
        },2000, listContainer);
        if(idString == "sort-by")
        {
            var obj = {};
            obj[event.target.getAttribute("data-sort-type")] = event.target.getAttribute("data-sort-value");
            sortHandler(obj);
        }
        else
        {
            document.getElementById("search-box").value = "";
            currentSearchType = null;
            currentSearchValue = null;
            currentSearchCategoryType = "category";
            currentSearchCategoryName = event.target.innerHTML;
            if(currentSearchCategoryName == "All")
            {
                currentSearchCategoryType = null;
                currentSearchCategoryName = null;
            }
            activeCategory = currentSearchCategoryName;
            currentFilters = [];
            updateFilterTab(currentSearchCategoryName);
            updateSearch();
        }
    }
});

var textSearchTimeout;
document.getElementById("search-box").addEventListener("keyup", function (event)
{
    var searchBox = document.getElementById("search-box");
    clearTimeout(textSearchTimeout);
    textSearchTimeout = setTimeout(function()
    {
        if(searchBox.value == "")
        {
            currentSearchType = null;
            currentSearchValue = null;
        }
        else if(/^\d/.test(searchBox.value))
        {
            currentSearchType = "part_number";
            currentSearchValue = searchBox.value.replace("-", "");
        }
        else if(/^\D/.test(searchBox.value))
        {
            currentSearchType = "name";
            currentSearchValue = searchBox.value;
        }
        updateSearch();
    }, 500);
});

document.getElementById("shopping-cart").addEventListener("input", function(event)
{
    if(event.target.hasAttribute("data-price") && event.target.value)
    {
        console.log(event.target.value);
        if(event.target.value < 1)
            event.target.value = 1;
        if(event.target.value > shoppingCart[event.target.getAttribute("data-cart-index")].part_info.quantity)
            event.target.value = shoppingCart[event.target.getAttribute("data-cart-index")].part_info.quantity;

        document.getElementById(event.target.getAttribute("data-price-id")).innerHTML = "$" + (event.target.getAttribute("data-price") * event.target.value).toFixed(2);
        shoppingCart[event.target.getAttribute("data-cart-index")].purchase_quantity = event.target.value;
        updatePriceInfo();
    }
});

function searchURLConstructor()
{
    var urlHost = "http://104.199.118.238/parts/";
    var urlParameters = "";

    if(currentSearchType && currentSearchValue)
    {
        urlHost += "search/";
        urlParameters += "search_type="+currentSearchType+"&search_text="+currentSearchValue;
    }
    if(currentSearchCategoryType && currentSearchCategoryName)
    {
        urlHost += "category/";
        urlParameters += "&category_type="+currentSearchCategoryType+"&category_name="+currentSearchCategoryName;
    }
    if(!currentSearchValue && !currentSearchCategoryName)
    {
        urlHost +="all/";
    }
    if(currentFilters.length > 0)
    {
        // console.log(currentFilters);
        urlHost += "filter/";
        urlParameters += "&filter_json="+JSON.stringify(currentFilters);
    }
    if(currentSortObject)
    {
        var keyName = Object.keys(currentSortObject)[0];
        urlParameters += "&sort_type="+keyName+"&sort_value="+currentSortObject[keyName]+"&page="+currentSearchPage;
    }

    if(urlParameters != "")
    {
        urlHost += "?";
    }

    console.log(urlHost+urlParameters);
    return urlHost+urlParameters;
}

var ticking = false;
var scrollTimeout;

searchResultsContainer.addEventListener("scroll", function(event)
{
    clearTimeout(scrollTimeout);
    pauseEvents = true;
    scrollTimeout = setTimeout(function()
    {
        pauseEvents = false;
        if(pausedMouseEnter)
        {
            addToCartTab(pausedMouseEnter, 11);
        }
    }, 100);

    if (!ticking)
    {
        window.requestAnimationFrame(function()
        {
            ticking = false;
            checkContainerForChildRemoval();
        });
    }
    ticking = true;
});

var spinnerTimeoutCounter = 0;
function checkPageSpinner()
{
    setTimeout(function()
    {
        spinnerTimeoutCounter++;
        if(resultsReceived || spinnerTimeoutCounter == 4)
        {
            spinnerTimeoutCounter = 0;
            var pageSpinner = document.getElementById("page_spinner");
            if(pageSpinner)
            {
                pageSpinner.style.opacity = 0;
                pageSpinner.parentNode.removeChild(pageSpinner);
                if(!resultsReceived)
                {
                    searchResultsContainer.insertAdjacentHTML('beforeend', '<div style="text-align: center; width: 85%; font-size: 1.3vw">No Results Found.</div>');
                    return;
                }
                addResults(newData);
            }
        }
        else
        {
            checkPageSpinner();
        }
    }, 750);
}

function checkContainerForChildRemoval()
{
    var topDiv = document.getElementById(topDivId+"");
    var bottomDiv = document.getElementById(bottomDivId+"");

    if(searchResultsContainer.scrollTop - lastScrollPosition > 0)
    {
        if(topDiv && topDiv.getBoundingClientRect().bottom < 50)
        {
            if(bottomDivId < searchResults.length-4)
            {
                topDiv.parentNode.removeChild(topDiv);
                topDivId += 4;
                bottomDivId += 4;
                addChunk(bottomDivId, "beforeend");
            }
            else if(bottomDivId >= currentSearchPage*80*.75)
            {
                if(!noMoreResults)
                {
                    currentSearchPage++;
                    searchResultsContainer.insertAdjacentHTML("beforeend",
                        '<div id="page_spinner" class="spinner opacity-transition" style="display: block; opacity: 1; margin: 1vw 41vw; position: relative">'+
                        '<div class="double-bounce1"></div>'+
                        '<div class="double-bounce2"></div>'+
                        '</div>');
                    updateSearch(loadPositionEnum.BOTTOM);
                    checkPageSpinner();
                }
            }

        }
    }
    else if(searchResultsContainer.scrollTop - lastScrollPosition < 0)
    {
        if(bottomDiv && bottomDiv.getBoundingClientRect().top > document.documentElement.clientHeight && topDivId != 0)// window.innerHeight+(bottomDiv.offsetHeight) && topDivId != 0)
        {
            bottomDiv.parentNode.removeChild(bottomDiv);
            bottomDivId -= 4;
            topDivId -= 4;
            addChunk(topDivId, "afterbegin");
            if(topDivId == currentSearchPage*80*.25 && currentSearchPage != 1)
            {
                console.log("top div id "+topDivId);
                console.log("page "+currentSearchPage);
                currentSearchPage--;
                updateSearch(loadPositionEnum.TOP);
            }
        }
    }
    lastScrollPosition = searchResultsContainer.scrollTop;
}
var resultsReceived = false;
var noMoreResults = false;
var newData = [];
var currentLoadPosition = 0;
var loadPositionEnum = Object.freeze({INITIAL: 0, TOP: -1, BOTTOM: 1});
function updateSearch(loadPosition)
{
    resultsReceived = false;

    loadPosition = loadPosition || loadPositionEnum.INITIAL;
    currentLoadPosition = loadPosition;
    if(loadPosition == loadPositionEnum.INITIAL)
    {
        currentSearchPage = 1;
        while (searchResultsContainer.firstChild)
        {
            searchResultsContainer.removeChild(searchResultsContainer.firstChild);
        }
        searchResultsContainer.insertAdjacentHTML("beforeend",
            '<div id="page_spinner" class="spinner opacity-transition" style="display: block; opacity: 1; margin: 1vw 41vw; position: relative">'+
            '<div class="double-bounce1"></div>'+
            '<div class="double-bounce2"></div>'+
            '</div>');
    }
    checkPageSpinner();

    getAjax(searchURLConstructor(), function(jsonData)
    {
        resultsReceived = true;

        jsonData = JSON.parse(jsonData);
        if(jsonData.length == 0)
        {
            if(loadPositionEnum.BOTTOM)
            {
                currentSearchPage--;
                noMoreResults = true;
            }
        }
        newData = jsonData;
    });
}

function addResults(data)
{
    noMoreResults = false;

    switch(currentLoadPosition)
    {
        case loadPositionEnum.INITIAL:
            searchResultsContainer.scrollTop = 0;
            topDivId = 0;
            bottomDivId = 12;

            searchResults = data;

            for(var i=0; i < 13; i+=4)
            {
                addChunk(i, "beforeend");
            }
            break;
        case loadPositionEnum.BOTTOM:
            searchResults = searchResults.concat(data);
            topDivId +=4;
            bottomDivId+=4;
            addChunk(bottomDivId, "beforeend");
            break;
        case loadPositionEnum.TOP:
            searchResults = data.concat(searchResults);
            break;
    }
}

function addChunk(index, at)
{
    if(index > searchResults.length)
        return;

    var loopController = 4;
    if(document.body.clientWidth < 1200 && document.body.clientWidth > 900)
        loopController = 6;

    var loopLength = loopController;
    if(index >= (searchResults.length-searchResults.length % loopController))
    {
        loopLength = searchResults.length % loopController;
    }
    searchResultsContainer.insertAdjacentHTML(at, '<div id="'+index+'" style=" margin-right: 10vw; display: flex; justify-content: space-between; flex-wrap: wrap">');
    for(var i = 0; i < loopLength; i++)
    {
        var detailsString = "";
        var numberOfTabs = 0;
        var needDivider = false;
        var dividerStyle = "";

        if(searchResults[index+i].long_description)
            numberOfTabs++;
        if(searchResults[index+i].specifications)
            numberOfTabs++;
        if(searchResults[index+i].compatible_models)
            numberOfTabs++;
        if(numberOfTabs > 1)
            needDivider = true;

        if(searchResults[index+i].long_description)
        {
            dividerStyle = "";
            if(needDivider)
                dividerStyle = "border-right: 1px white solid";
            detailsString += '<li data-details-tab-open="no" data-cart-item-index="'+(index+i)+'" class="details-button" style="'+dividerStyle+'">Description</li>';
        }
        if(searchResults[index+i].specifications)
        {
            detailsString += '<li data-details-tab-open="no" data-cart-item-index="'+(index+i)+'" class="details-button"">Spec</li>';
        }
        if(searchResults[index+i].compatible_models)
        {
            dividerStyle = "";
            if(needDivider)
                dividerStyle = "border-left: 1px white solid";
            detailsString += '<li data-details-tab-open="no" data-cart-item-index="'+(index+i)+'" class="details-button" style="'+dividerStyle+'">Compatibility</li>';
        }

        document.getElementById(index).insertAdjacentHTML('beforeend',
            '<div id="item-container'+(index+i)+'" class="item-box" onmouseenter="addToCartTab(this, 11)" data-cart-item-index="'+(index+i)+'" style="display:inline-block; margin: 5px auto;  padding: 0 0; position: relative; background-color: #ddd">'+
            '<div style="text-align: center; padding: .5vw 1vw 0 1vw; font-size: 1.1vw; height: 3vw; max-height: 3vw; overflow: hidden; line-height: 2.4vw"><span style="display: inline-block; vertical-align: middle; line-height: normal">'+searchResults[index+i].name+' - '+searchResults[index+i].part_number+'</span></div>'+
            '<div style="z-index: '+(Math.floor(500/(i+1))+1)+'; height:17vw; margin: 0 .5vw; background-color: white; position: relative">'+
            '<img style="max-height: 100%; max-width: 100%; position: absolute; top: 0; left: 0; bottom: 0; right: 0; margin: auto;" src="'+searchResults[index+i].image_source+'" onerror="sourceImageError(this)">'+
            '<div style="position: absolute; top: 0; right: 0; padding: .5vw; text-align: right; background-color: rgba(66,65,61,.85); color: white;">'+(searchResults[index+i].price||"price&nbsp;unavailable")+'</div>'+
            '<svg id="check'+(index+i)+'" class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>'+
            '<div id="load'+(index+i)+'" class="spinner">'+
            '<div class="double-bounce1"></div>'+
            '<div class="double-bounce2"></div>'+
            '</div>'+
            '</div>'+
            '<div style="padding:0 1vw; margin: .5vw 0; height: 3vw; text-align: center; font-size: 1.1vw; max-height: 3vw; overflow: hidden; line-height: 2.8vw;"><span style="display: inline-block; vertical-align: middle; line-height: normal">'+nullConverter(searchResults[index+i].short_description, true)+'</span></div>'+
            '<ul style="text-align: center; background-color: #42413D; color: white; cursor: pointer; display: table; width:100%;position: absolute; top: 24vw">'+
            detailsString+
            '</ul>'+
            '<div id="add-to-cart'+(index+i)+'" class="translate-transition" style="z-index: '+(Math.floor(500/(i+1)))+'; overflow: hidden; color: white; position: absolute; left: 9vw; top: 8vw; display: inline-block;  width: 10vw; background-color: #444444">'+
            '<div style="padding: 0 1vw; text-align: left">'+
            '<div style="margin: .5vw 0"><span>'+searchResults[index+i].quantity+' in stock</span></div>'+
            '<div style="margin: .5vw 0"><input id="quantity-stepper'+(index+i)+'" type="number" style="width: 100%; font-family: inherit; font-size: .85em" placeholder="Purchase Qty"></div>'+
            '<button data-cart-item-index="'+(index+i)+'" class="btn" style="margin-bottom: 1vw">Add to Cart</button>'+
            '</div>'+
            '</div>'+
            '<div id="item-details'+(index+i)+'" class="height-transition" style="z-index: 1000; padding: 0 1vw; margin:0;overflow: hidden; height: 0; color: white; position: absolute; top: 100%; left: 0; right: 0; width: 18.5vw; overflow-y: auto; max-height: 12vw; background-color: #444444">'+
            '<div id="Description'+(index+i)+'" style="display: none; white-space: normal; font-size: 1.1vw; padding-top: .5vw">'+searchResults[index+i].long_description+'</div>'+
            '<div id="Spec'+(index+i)+'" style="display: none; white-space: normal; font-size: 1.1vw; padding-top: .5vw">'+jsonCatFormat(searchResults[index+i].specifications)+'</div>'+
            '<div id="Compatibility'+(index+i)+'" style="display: none; white-space: normal; font-size: 1.1vw; padding-top: .5vw">'+jsonCatFormat(searchResults[index+i].compatible_models)+'</div>'+
            '</div>'+
            '</div>');
    }
    searchResultsContainer.insertAdjacentHTML('beforeend', '</div>');
}

function sourceImageError(element)
{
    if(element.src != 'http://ncparts.s3.amazonaws.com/cat_parts_generic.jpeg')
        element.src='http://ncparts.s3.amazonaws.com/cat_parts_generic.jpeg';
}

document.getElementById("search-results-container").addEventListener("click", function(event)
{
    if(event.target.classList.contains("btn"))
    {
        addToCart(event.target.getAttribute("data-cart-item-index"));
        var checkMark = document.getElementById("check"+event.target.getAttribute("data-cart-item-index"));

        checkMark.style.opacity = 1;
        checkMark.style.display = "block";
        setTimeout(function ()
        {
            checkMark.style.opacity = 0;
            setTimeout(function()
            {
                checkMark.style.display = "none";
            }, 250);
        }, 1950);

    }
    else if(event.target.hasAttribute("data-details-tab-open"))
    {
        var tabs = event.target.parentNode.childNodes;
        var areAnyTabsOpen = false;
        var itemIndex = event.target.getAttribute("data-cart-item-index");

        for(var i = 0; i < tabs.length; i++)
        {
            if(tabs[i] == event.target)
            {
                if(tabs[i].getAttribute("data-details-tab-open") == "no")
                {
                    tabs[i].setAttribute("data-details-tab-open", "yes");
                    document.getElementById(tabs[i].innerHTML+itemIndex).style.display = "block";
                    tabs[i].className += " active-detail";
                    areAnyTabsOpen = true;
                }
                else
                {
                    tabs[i].setAttribute("data-details-tab-open", "no");
                    tabs[i].classList.remove("active-detail");
                }
            }
            else if(tabs[i].tagName == "LI")
            {
                tabs[i].setAttribute("data-details-tab-open", "no");
                document.getElementById(tabs[i].innerHTML+itemIndex).style.display = "none";
                tabs[i].classList.remove("active-detail");
            }
        }
        if(!areAnyTabsOpen)
        {
            document.getElementById("item-details"+event.target.getAttribute("data-cart-item-index")).style.height = "0";
        }
        else
        {
            document.getElementById("item-details"+event.target.getAttribute("data-cart-item-index")).style.height = "12vw";
        }
    }

});

var pausedMouseEnter = null;
var lastOpenAddToCartElement = null;

function addToCartTab(element, translateXTo)
{
    translateXTo = translateXTo || 0;

    if(pauseEvents && translateXTo > 0)
    {
        pausedMouseEnter = element;
    }
    else if(document.getElementById(element.id))
    {
        if(translateXTo > 0)
        {
            if(lastOpenAddToCartElement)
            {
                addToCartTab(lastOpenAddToCartElement, 0);
            }
            lastOpenAddToCartElement = element;
        }
        document.getElementById("add-to-cart"+element.getAttribute("data-cart-item-index")).style.transform = "translate("+translateXTo+"vw, 0)";
    }
}

function nullConverter(objectValue, shouldLeaveBlank)
{
    if(!objectValue)
    {
        if(shouldLeaveBlank)
        {
            objectValue = "";
        }
        else
        {
            objectValue = "not available";
        }
    }
    return objectValue;
}

function jsonCatFormat(json)
{
    if(json)
    {
        json = json.replace(/}, {/g, "<br>").replace(/[\[\]{}"]+/g, "");
    }
    return json;
}

var isShoppingCartOpen = false;
var isSubcategoryDropdownOpen = false;

document.getElementById("clear-cart").addEventListener("click", function(event)
{
    if(confirm("Would you like to empty your cart?"))
    {
        for(var i = 0; i < shoppingCart.length; i++)
        {
            removeCartItem(i);
        }
    }
});

function openShoppingCart()
{
    if(numberOfItemsInCart == 0)
    {
        return;
    }

    if(!isShoppingCartOpen)
    {
        isShoppingCartOpen = true;

        var headerContainer = document.getElementById("header-container");
        while (headerContainer.firstChild)
        {
            headerContainer.removeChild(headerContainer.firstChild);
        }

        for(var i = 0; i < shoppingCart.length; i++)
        {
            if(shoppingCart[i])
            {
                headerContainer.insertAdjacentHTML('beforeend',
                    '<div id="cart'+i+'" style="float: left; box-sizing: border-box; width: 100%; border: 2px solid gray; padding: 6px; margin-bottom: 8px">'+
                    '<div style="float:left; height:14vw; width:14vw; background-color: white; position: relative"><img style="max-width: 100%; max-height: 100%; position: absolute; top: 0; left: 0; bottom: 0; right: 0; margin: auto;" src="'+shoppingCart[i].part_info.image_source+'"></div>'+
                    '<div style="overflow: auto; padding-top: .75vw">'+
                    '<span style="float:left;margin-left: 1vw"><b style="font-size: 1.2vw">'+shoppingCart[i].part_info.name+'</b><br>'+nullConverter(shoppingCart[i].part_info.short_description, true)+'</span>'+
                    '<span style="float: right">Qty.<input class="stepper" min="1" max="'+shoppingCart[i].part_info.quantity+'" value="'+shoppingCart[i].purchase_quantity+'" type="number" data-price-id="price'+i+'" data-cart-index="'+i+'" data-price="'+shoppingCart[i].part_info.price.replace("$", "")+'"/>&nbsp;&nbsp;<b id="price'+i+'">$'+(shoppingCart[i].part_info.price * shoppingCart[i].purchase_quantity).toFixed(2)+'</b></span>'+
                    '<div style="float: right; clear: right; margin-top: 4px">'+
                    '<span>'+shoppingCart[i].part_info.part_number+'</span>'+
                    '<span onclick="removeCartItem('+i+')" style="color: blue; margin-left: 8px; cursor: pointer">Remove</span>'+
                    '</div>'+
                    '</div>'+
                    '</div>'
                );
            }
        }

        updatePriceInfo();

        var subcategoryPusher = document.getElementById("subcategory-pusher");
        if(subcategoryPusher.style.height.match(/(\d|\.)+/)[0] > 0)
        {
            isSubcategoryDropdownOpen = true;
            subcategoryPusher.className = "";
            subcategoryPusher.style.height = 0;
        }

        document.getElementById("search-results-container").style.display = "none";
        document.getElementById("sort-container").style.visibility = "hidden";
        document.getElementById("search-box").style.visibility = "hidden";
        document.getElementById("search-icon").style.visibility = "hidden";
        document.getElementById("shopping-cart").style.display = "block";
    }
    else
    {
        closeShoppingCart();
    }
}

function hideNavElements()
{
    document.getElementById("cart").style.display = "none";
    document.getElementById("sort-container").style.display = "none";
    // document.getElementById("search-box").style.display = "none";
    // document.getElementById("search-icon").style.display = "none";
}

function closeShoppingCart()
{
    isShoppingCartOpen = false;
    if(isSubcategoryDropdownOpen)
    {
        document.getElementById("subcategory-pusher").style.height = "3.4vw";
        document.getElementById("search-results-container").style.height = "calc(100vh - 9.3vw)";
        document.getElementById("subcategory-pusher").className = "height-transition";
    }
    document.getElementById("shopping-cart").style.display = "none";
    document.getElementById("sort-container").style.visibility = "visible";
    document.getElementById("search-box").style.visibility = "visible";
    document.getElementById("search-icon").style.visibility = "visible";
    // document.getElementById("side-bar").style.display = "block";
    document.getElementById("search-results-container").style.display = "block";
}

function addToCart(itemIndex)
{
    if(document.getElementById("quantity-stepper"+itemIndex).value > 0)
    {
        var cartIndex = -1;
        for(var i = 0; i < shoppingCart.length; i++)
        {
            if(shoppingCart[i] && shoppingCart[i].part_info.part_number == searchResults[itemIndex].part_number)
            {
                cartIndex = i;
                break;
            }
        }

        // var cartIndex = shoppingCart.findIndex(function(cartItem)
        // {
        //     cartItem.part_info.part_number = cartItem.part_info.part_number || "0000000";
        //     return cartItem.part_info.part_number == searchResults[itemIndex].part_number;
        // });

        if(cartIndex != -1 && shoppingCart[cartIndex].purchase_quantity + +document.getElementById("quantity-stepper"+itemIndex).value <= shoppingCart[cartIndex].part_info.quantity)
        {
            shoppingCart[cartIndex].purchase_quantity += +document.getElementById("quantity-stepper"+itemIndex).value;
        }
        else if(cartIndex == -1 && +document.getElementById("quantity-stepper"+itemIndex).value <= searchResults[itemIndex].quantity)
        {
            var cartObject = {
                "part_info": searchResults[itemIndex],
                "purchase_quantity": +document.getElementById("quantity-stepper"+itemIndex).value};

            cartObject.part_info.price = cartObject.part_info.price.replace(/(\$|,)+/g, "");
            shoppingCart.push(cartObject);
            numberOfItemsInCart++;

            localStorage.setItem("_shoppingCart", JSON.stringify(shoppingCart));

            document.getElementById("cart").style.color = "black";
            document.getElementById("cart").style.backgroundColor = "#ffce2b";
        }
        else //Show tooltip
        {
        }
    }
}

function updatePriceInfo()
{
    var totalPrice = 0;

    for(var i = 0; i < shoppingCart.length; i++)
    {
        if(shoppingCart[i])
        {
            totalPrice += parseFloat(shoppingCart[i].part_info.price) * shoppingCart[i].purchase_quantity;
        }
    }

    var tax = totalPrice * .08;
    var sumTotal = tax + 12.01 + totalPrice;

    document.getElementById("cart-total-price").innerHTML = "$" + totalPrice.toFixed(2);
    document.getElementById("cart-tax").innerHTML = "$" + tax.toFixed(2);
    document.getElementById("sum-total").innerHTML = "$" + sumTotal.toFixed(2);
}

function removeCartItem(index)
{
    if(shoppingCart[index])
    {
        shoppingCart[index] = null;
        numberOfItemsInCart--;
        if(numberOfItemsInCart == 0)
        {
            shoppingCart = [];

            document.getElementById("cart").style.color = "white";
            document.getElementById("cart").style.backgroundColor = "#545657";

            closeShoppingCart();
        }
        var cartItem = document.getElementById("cart"+index);
        cartItem.parentNode.removeChild(cartItem);
        updatePriceInfo();
        localStorage.setItem("_shoppingCart", JSON.stringify(shoppingCart));
    }
}

function sortHandler(sortObject)
{
    currentSortObject=sortObject;
    if(searchResults)
    {
        updateSearch();
    }
}

 ///  https://plainjs.com/javascript/ajax/send-ajax-get-and-post-requests-47/  \\\
///=============================================================================\\\

function getAjax(url, success) {
    var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
    xhr.open('GET', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState>3 && xhr.status==200) success(xhr.responseText);
    };
    // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send();
    return xhr;
}

var resizeTimeout;
var lastWindowWidth = document.body.clientWidth;
console.log(lastWindowWidth);

window.addEventListener("resize", function()
{
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function()
    {
        if(document.body.clientWidth != lastWindowWidth)
        {
            lastWindowWidth = document.body.clientWidth;
            updateSearch();
            //TODO user loses spot, use pagination to fix (deal with jumping from 3 to four items per chunk)
        }
    }, 100);
});

var isNavOpen = false;
function toggleMobileNavDropdown()
{
    if(isNavOpen)
    {
        isNavOpen = false;
        document.getElementById("mobile-nav-dropdown").style.height = "0";

    }
    else
    {
        isNavOpen = true;
        document.getElementById("mobile-nav-dropdown").style.height = 'calc(100vh - 58px)';
    }
}

// hideNavElements();

updateSearch();