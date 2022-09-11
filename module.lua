local module = {}

--DATA PART

--SENSITIVE
SERVER_ADRESS = "https://RobloxApplicationManager.omega77073.repl.co" --Must use HTTPS
SECRET_KEY = "yuRjWgs3vUXz7GMpXxStgLFBNQF6za3NvQur26tT6QRNbuXZVhaKfrgNXPaM9n9UWX5J8mtLca2dNPvuktu8yKPdcpMfPBZewtJr9G5st9MUmcD6CXdtpKgP" 
--Do not leak allows for verification that the request is from roblox

--DISCORD DATA
GUILD_ID = "1007807710902886513"
CHANNEL_ID = "1009870911194808420"


module.fieldtypes = {
	["boolean"] = "boolean",
	["input"] = "string",
	["textArea"] = "string",
	["number"] = "number"
}


module.applicationsData = {
	["testApplication"] = {
		["name"] = "TestApp",
		["description"] = "Desc",
		["rankRequirement"] = {"a"},
		["fields"] = {
			["TestBoolean"] = {
				["title"] = "Test Boolean",
				["description"] = "This is a test",
				["dataType"] = "boolean"
			}
		}
	}
}

--END OF DATA PART

local HTTPS = game:GetService("HttpService")

--[[
Example response

response = {

 ["fields"] = {
 	["TestBoolean"] = true
 }

}

]]


function module.send(player,applicationID,response)
	local applicationData = module.applicationsData[applicationID]
	local data = {
		["player"] = {
			["id"] = player.UserId,
			["displayName"] = player.DisplayName,
			["age"] = player.accountAge,
			["name"] = player.Name
		},
		
		["data"] = {
			
		},
		["name"] = applicationData.name,
		["key"] = SECRET_KEY,
		["discord"] = {
			["guildId"] = GUILD_ID,
			["channelId"] = CHANNEL_ID
		},
		["time"] = os.time()
	}
	
	if(#applicationData.fields ~= #response.fields)then
		error("APPLICATION_MANAGER -- Application and Response field numbers were different")
	end
	
	for key,field in pairs(applicationData.fields) do
		if(typeof(response.fields[key]) ~= module.fieldtypes[field.dataType])then
			error("APPLICATION_MANAGER -- Invalid value type at field:" .. key .. "(provided: " .. typeof(response.fields[key]) .. ", expected: " .. module.fieldtypes[field.dataType])
		end
		table.insert(data.data,{
			["answer"] = response.fields[key],
			["title"] = field.title,
			["description"] = field.description,
			["type"] = field.dataType
		})
	end
	
	response = HTTPS:PostAsync(SERVER_ADRESS .. "/apply", HTTPS:JSONEncode(data), Enum.HttpContentType.ApplicationJson)
	print(response)
end


return module
