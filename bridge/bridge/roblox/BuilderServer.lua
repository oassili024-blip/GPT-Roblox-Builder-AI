local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local OWNER_NAME = "omar7tadine77"
local BRIDGE_URL = "https://YOUR-BRIDGE-HOST.example.com/build"
local BRIDGE_TOKEN = "REPLACE_WITH_A_LONG_RANDOM_SECRET"

local event = ReplicatedStorage:FindFirstChild("BuilderEvent")
if not event then
	event = Instance.new("RemoteEvent")
	event.Name = "BuilderEvent"
	event.Parent = ReplicatedStorage
end

local folder = workspace:FindFirstChild("GPT_Builds")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "GPT_Builds"
	folder.Parent = workspace
end

local busy = {}

event.OnServerEvent:Connect(function(player, prompt)
	if player.Name ~= OWNER_NAME then return end
	if typeof(prompt) ~= "string" or #prompt < 3 or #prompt > 500 then return end
	if busy[player.UserId] then return end

	busy[player.UserId] = true

	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = BRIDGE_URL,
			Method = "POST",
			Headers = {
				["Content-Type"] = "application/json",
				["x-bridge-token"] = BRIDGE_TOKEN
			},
			Body = HttpService:JSONEncode({
				prompt = prompt,
				playerName = player.Name
			})
		})
	end)

	if success and response.Success then
		local decoded = HttpService:JSONDecode(response.Body)
		local parts = decoded.parts or {}

		for i, item in ipairs(parts) do
			if i > 50 then break end
			if typeof(item) ~= "table" then continue end

			local part = Instance.new("Part")
			part.Name = tostring(item.name or "GeneratedPart"):sub(1, 40)
			part.Anchored = true
			part.Size = Vector3.new(
				math.clamp(tonumber(item.x) or 4, 1, 30),
				math.clamp(tonumber(item.y) or 4, 1, 30),
				math.clamp(tonumber(item.z) or 4, 1, 30)
			)

			part.Position = Vector3.new(
				math.clamp(tonumber(item.px) or 0, -100, 100),
				math.clamp(tonumber(item.py) or 5, 1, 100),
				math.clamp(tonumber(item.pz) or 0, -100, 100)
			)

			part.Parent = folder
		end
	end

	busy[player.UserId] = nil
end)
