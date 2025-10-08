"use client"

import { Button } from "@/components/ui/button"
import { MoreVertical, Trash2, Edit, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Test component pour débugger le dropdown
 * Usage: Importer dans la page et vérifier si ça fonctionne
 */
export function TestDropdown() {
  return (
    <div className="p-8 border-2 border-red-500 bg-white">
      <h2 className="mb-4 font-bold">TEST DROPDOWN</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" onClick={() => console.log("[TEST] Button clicked")}>
            <MoreVertical className="h-4 w-4 mr-2" />
            Ouvrir Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" style={{ zIndex: 99999, backgroundColor: 'red', color: 'white' }}>
          <DropdownMenuItem onClick={() => console.log("[TEST] Item 1 clicked")}>
            <Star className="mr-2 h-4 w-4" />
            Option 1
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => console.log("[TEST] Item 2 clicked")}>
            <Edit className="mr-2 h-4 w-4" />
            Option 2
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => console.log("[TEST] Item 3 clicked")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Option 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
