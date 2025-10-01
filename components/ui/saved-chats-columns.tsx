"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Calendar, 
  Hash, 
  ExternalLink,
  Eye,
  Trash2,
  Star,
  StarOff
} from "lucide-react"
import { SortableHeader } from "@/components/ui/enhanced-data-table"
import { formatDistanceToNow } from "date-fns"

// Saved chat interface (matching the structure from saved-queries page)
export interface SavedChat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  messageCount: number
  userId: string
  category?: string
  tags?: string[]
  isStarred?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  reasoning?: string
  sqlQuery?: string
  metadata?: any
  feedback?: 'positive' | 'negative' | null
  followUpQueries?: string[]
}

export const savedChatsColumns: ColumnDef<SavedChat>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader title="Conversation Title" column={column} />,
    cell: ({ row }) => {
      const chat = row.original
      const lastMessage = chat.messages[chat.messages.length - 1]
      
      return (
        <div className="flex items-start space-x-3 max-w-md">
          <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="font-medium text-sm leading-5 text-gray-900">
              {chat.title}
            </div>
            {lastMessage && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {lastMessage.role === 'user' ? 'You: ' : 'Assistant: '}
                {lastMessage.content.substring(0, 100)}
                {lastMessage.content.length > 100 ? '...' : ''}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "messageCount",
    header: ({ column }) => <SortableHeader title="Messages" column={column} />,
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Hash className="h-4 w-4 text-gray-500" />
        <span className="font-mono text-sm font-medium">
          {row.getValue("messageCount")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader title="Category" column={column} />,
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      
      if (!category) {
        return <span className="text-gray-400 text-sm">-</span>
      }
      
      return (
        <Badge variant="outline" className="capitalize">
          {category}
        </Badge>
      )
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags || []
      
      if (tags.length === 0) {
        return <span className="text-gray-400 text-sm">-</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0.5">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <SortableHeader title="Last Updated" column={column} />,
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as Date
      
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader title="Created" column={column} />,
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date
      
      return (
        <span className="text-sm text-gray-500">
          {createdAt.toLocaleDateString()}
        </span>
      )
    },
  },
  {
    id: "starred",
    header: "Starred",
    cell: ({ row }) => {
      const chat = row.original
      const isStarred = chat.isStarred || false
      
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Toggle starred status
            console.log('Toggle starred:', chat.id)
          }}
          className="h-8 w-8 p-0"
        >
          {isStarred ? (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          ) : (
            <StarOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="sr-only">
            {isStarred ? 'Remove from favorites' : 'Add to favorites'}
          </span>
        </Button>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const chat = row.original
      
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('View chat:', chat.id)}
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View conversation</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/chat?resume=${chat.id}`}
            className="h-8 px-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Resume conversation</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log('Delete chat:', chat.id)}
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete conversation</span>
          </Button>
        </div>
      )
    },
  },
]

// Filter options for saved chats
export const savedChatsFilterOptions = [
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Analytics", value: "analytics" },
      { label: "Financial", value: "financial" },
      { label: "Operational", value: "operational" },
      { label: "Strategic", value: "strategic" },
      { label: "Compliance", value: "compliance" },
    ],
  },
  {
    id: "isStarred",
    title: "Favorites",
    options: [
      { label: "Starred", value: "true", icon: Star },
      { label: "Not Starred", value: "false", icon: StarOff },
    ],
  },
]