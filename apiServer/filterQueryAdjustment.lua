--
-- Created by IntelliJ IDEA.
-- User: ryanberg
-- Date: 12/4/16
-- Time: 1:45 PM
--

--local cjson = require "cjson"
--local cjson2 = cjson.new()
local cjson_safe = require "cjson.safe"

function parseSort()
    local pageOffset = 0
    if ngx.var.arg_page then
        pageOffset = ngx.var.arg_page
    end

    if ngx.var.arg_sort_type and ngx.var.arg_sort_value then
        ngx.var.sort_query = " order by " .. ngx.var.arg_sort_type .. " " .. ngx.var.arg_sort_value .. " limit 80 offset " .. (80*(pageOffset-1))
    end
end
function parseFilterParameters()
--    ngx.say(ngx.var.arg_filter_json)
    local filterJSON = cjson_safe.decode(ngx.var.arg_filter_json)
--    ngx.say(cjson_safe.encode(filterJSON[2].filter_name))--[{filter_type: "", filter_name: ""}, {filter_type: "", filter_name: ""}]--filterJSON["Sensor Type"]

--    ngx.say(ngx.var.arg_filter_json)

    if filterJSON.length ~= 0 then
        local filterQueryString = "where "

        for i = 1, #filterJSON
        do
            if i > 1 then
                filterQueryString = (filterQueryString .. " and ")
            end

            filterQueryString = (filterQueryString .. "specifications ->> '".. filterJSON[i].filter_name .."' = '".. filterJSON[i].filter_value .."'")
        end

        ngx.var.filter_query = filterQueryString
    end
end
function boundaryCheck()
    local radius;
    if ngx.var.arg_radius then
        radius = tonumber(ngx.var.arg_radius)

        if radius > 0 and radius <= 10 then
            radius = ngx.var.arg_radius
        elseif radius > 10 then
            radius = 10
        end

    else
        radius = 1;
    end

--  miles to degrees
    radius = radius * .01666666666;

    ngx.var.boundary_query = " where ("..ngx.var.arg_latitude.."<"..ngx.var.arg_latitude+radius.." and "..ngx.var.arg_latitude..">"..ngx.var.arg_latitude-radius..
            ") and ("..ngx.var.arg_longitude..">"..ngx.var.arg_longitude-radius.." and "..ngx.var.arg_longitude.."<"..ngx.var.arg_longitude+radius..")"

end