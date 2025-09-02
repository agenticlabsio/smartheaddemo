import { type NextRequest, NextResponse } from "next/server"
import { mcpClient } from "@/lib/mcp-client"

export async function POST(req: NextRequest) {
  try {
    const { tool, parameters } = await req.json()

    if (!tool) {
      return NextResponse.json({ error: "Tool name is required" }, { status: 400 })
    }

    const result = await mcpClient.executeTool(tool, parameters || {})

    return NextResponse.json(result)
  } catch (error) {
    console.error("MCP API error:", error)
    return NextResponse.json({ error: "Failed to execute MCP tool" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const tools = mcpClient.getAvailableTools()
    const connections = mcpClient.getConnections()
    const status = mcpClient.getConnectionStatus()

    return NextResponse.json({
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
      connections,
      status,
    })
  } catch (error) {
    console.error("MCP status API error:", error)
    return NextResponse.json({ error: "Failed to get MCP status" }, { status: 500 })
  }
}
