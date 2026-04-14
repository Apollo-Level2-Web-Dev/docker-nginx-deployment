/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { type ISpecialty } from "@/types/specialty.types"
import { ChevronDown } from "lucide-react"

interface SpecialtiesMultiSelectProps {
  specialties: ISpecialty[]
  selectedSpecialtyIds: string[]
  onChange: (nextValue: string[]) => void
  onBlur: () => void
  isLoadingSpecialties?: boolean
  error?: any
  getErrorMessage: (error: any) => string
}

const SpecialtiesMultiSelect = ({
  specialties,
  selectedSpecialtyIds,
  onChange,
  onBlur,
  isLoadingSpecialties = false,
  error,
  getErrorMessage,
}: SpecialtiesMultiSelectProps) => {
  const selectedTitles = selectedSpecialtyIds
    .map((id) => specialties.find((specialty) => specialty.id === id)?.title)
    .filter((title): title is string => Boolean(title))

  const triggerText = isLoadingSpecialties
    ? "Loading specialties..."
    : selectedTitles.length > 0
      ? `${selectedTitles.length} selected`
      : "Select specialties"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className={cn(error && "text-destructive")}>Specialties</Label>
        {selectedSpecialtyIds.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1">
            {selectedSpecialtyIds.map((specialtyId) => {
              const specialty = specialties.find((item) => item.id === specialtyId)

              return specialty ? (
                <Badge key={specialty.id} variant="secondary">
                  {specialty.title}
                </Badge>
              ) : null
            })}
          </div>
        )}
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between",
              error && "border-destructive",
            )}
            disabled={isLoadingSpecialties || specialties.length === 0}
          >
            <span className="truncate text-left">{triggerText}</span>
            <ChevronDown className="size-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) max-h-72 overflow-y-auto"
        >
          {isLoadingSpecialties ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">Loading specialties...</p>
          ) : specialties.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">No specialties available.</p>
          ) : (
            specialties.map((specialty) => {
              const checked = selectedSpecialtyIds.includes(specialty.id)

              return (
                <DropdownMenuItem
                  key={specialty.id}
                  className="gap-3"
                  onSelect={(event) => event.preventDefault()}
                  onClick={() => {
                    const nextValue = checked
                      ? selectedSpecialtyIds.filter((item) => item !== specialty.id)
                      : [...selectedSpecialtyIds, specialty.id]

                    onChange(nextValue)

                    onBlur()
                  }}
                >
                  <Checkbox
                    checked={checked}
                    className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white"
                  />
                  <span>{specialty.title}</span>
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {error ? (
        <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
      ) : null}
    </div>
  )
}

export default SpecialtiesMultiSelect