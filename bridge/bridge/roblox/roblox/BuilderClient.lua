local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local event = ReplicatedStorage:WaitForChild("BuilderEvent")

local gui = Instance.new("ScreenGui")
gui.Name = "GPTBuilderAI"
gui.ResetOnSpawn = false
gui.Parent = player:WaitForChild("PlayerGui")

local open = Instance.new("TextButton")
open.Size = UDim2.fromOffset(65, 55)
open.Position = UDim2.new(1, -80, 0.5, -25)
open.Text = "GPT AI"
open.TextScaled = true
open.Parent = gui

local panel = Instance.new("Frame")
panel.Size = UDim2.fromOffset(300, 190)
panel.Position = UDim2.new(0.5, -150, 0.5, -95)
panel.BackgroundColor3 = Color3.fromRGB(30, 32, 40)
panel.Visible = false
panel.Parent = gui

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 40)
title.Text = "GPT ROBLOX BUILDER AI"
title.TextScaled = true
title.Parent = panel

local input = Instance.new("TextBox")
input.Size = UDim2.new(1, -20, 0, 65)
input.Position = UDim2.fromOffset(10, 50)
input.PlaceholderText = "اكتب ماذا تريد بناءه..."
input.Text = ""
input.TextScaled = true
input.MultiLine = true
input.Parent = panel

local build = Instance.new("TextButton")
build.Size = UDim2.new(1, -20, 0, 45)
build.Position = UDim2.fromOffset(10, 130)
build.Text = "BUILD"
build.TextScaled = true
build.Parent = panel

open.MouseButton1Click:Connect(function()
	panel.Visible = not panel.Visible
end)

build.MouseButton1Click:Connect(function()
	if input.Text ~= "" then
		event:FireServer(input.Text)
		build.Text = "SENT!"
		task.wait(2)
		build.Text = "BUILD"
	end
end)
