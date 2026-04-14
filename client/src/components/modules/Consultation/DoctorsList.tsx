"use client"

import DataTableFilters, {
  DataTableFilterConfig,
  DataTableFilterValues,
} from "@/components/shared/table/DataTableFilters"
import DataTableSearch from "@/components/shared/table/DataTableSearch"
import BookAppointmentModal from "@/components/modules/Patient/Appointments/BookAppointmentModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable"
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters"
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch"
import { getAllSpecialties, getDoctors } from "@/services/doctor.services"
import { type IDoctor } from "@/types/doctor.types"
import { type ISpecialty } from "@/types/specialty.types"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 12
const SPECIALTIES_FILTER_KEY = "specialties.specialty.title"
const APPOINTMENT_FEE_FILTER_KEY = "appointmentFee"
const CONSULTATION_ALLOWED_QUERY_KEYS = new Set([
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "searchTerm",
  "gender",
  SPECIALTIES_FILTER_KEY,
  `${APPOINTMENT_FEE_FILTER_KEY}[gte]`,
  `${APPOINTMENT_FEE_FILTER_KEY}[lte]`,
])

const CONSULTATION_FILTER_DEFINITIONS = [
  serverManagedFilter.single("gender"),
  serverManagedFilter.multi(SPECIALTIES_FILTER_KEY),
  serverManagedFilter.range(APPOINTMENT_FEE_FILTER_KEY),
]

const getSanitizedConsultationQueryString = (queryString: string) => {
  const currentParams = new URLSearchParams(queryString)
  const sanitizedParams = new URLSearchParams()

  currentParams.forEach((value, key) => {
    if (!CONSULTATION_ALLOWED_QUERY_KEYS.has(key)) {
      return
    }

    const normalizedValue = value.trim()
    if (!normalizedValue) {
      return
    }

    if (key === SPECIALTIES_FILTER_KEY) {
      sanitizedParams.append(key, normalizedValue)
      return
    }

    sanitizedParams.set(key, normalizedValue)
  })

  return sanitizedParams.toString()
}

const getDoctorInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "")
  return initials.join("") || "DR"
}

const Pagination = ({
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
}) => {
  if (totalPages <= 1) {
    return null
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isLoading || currentPage <= 1}
      >
        Prev
      </Button>

      {pageNumbers.map((page) => (
        <Button
          key={page}
          type="button"
          variant={page === currentPage ? "default" : "outline"}
          onClick={() => onPageChange(page)}
          disabled={isLoading}
        >
          {page}
        </Button>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLoading || currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

const DoctorsList = ({
  initialQueryString,
  isAuthenticated,
  viewerRole,
}: {
  initialQueryString: string
  isAuthenticated: boolean
  viewerRole?: string | null
}) => {
  const searchParams = useSearchParams()

  const {
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    updateParams,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable({
    searchParams,
    defaultPage: DEFAULT_PAGE,
    defaultLimit: DEFAULT_LIMIT,
  })

  const queryString = useMemo(() => {
    return getSanitizedConsultationQueryString(queryStringFromUrl || initialQueryString)
  }, [initialQueryString, queryStringFromUrl])

  const {
    searchTermFromUrl,
    handleDebouncedSearchChange,
  } = useServerManagedDataTableSearch({
    searchParams,
    updateParams,
  })

  const {
    filterValues,
    handleFilterChange,
    clearAllFilters,
  } = useServerManagedDataTableFilters({
    searchParams,
    definitions: CONSULTATION_FILTER_DEFINITIONS,
    updateParams,
  })

  const { data: doctorsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["doctors", queryString],
    queryFn: () => getDoctors(queryString),
  })

  const { data: specialtiesResponse } = useQuery({
    queryKey: ["specialties"],
    queryFn: getAllSpecialties,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
  })

  const doctors = doctorsResponse?.data ?? []
  const meta = doctorsResponse?.meta
  const specialties = useMemo(() => specialtiesResponse?.data ?? [], [specialtiesResponse?.data])

  const filterConfigs = useMemo<DataTableFilterConfig[]>(() => {
    return [
      {
        id: "gender",
        label: "Gender",
        type: "single-select",
        options: [
          { label: "Male", value: "MALE" },
          { label: "Female", value: "FEMALE" },
          { label: "Other", value: "OTHER" },
        ],
      },
      {
        id: SPECIALTIES_FILTER_KEY,
        label: "Specialties",
        type: "multi-select",
        options: specialties.map((specialty: ISpecialty) => ({
          label: specialty.title,
          value: specialty.title,
        })),
      },
      {
        id: APPOINTMENT_FEE_FILTER_KEY,
        label: "Fee Range",
        type: "range",
      },
    ]
  }, [specialties])

  const filterValuesForControls = useMemo<DataTableFilterValues>(() => {
    return {
      gender: filterValues.gender,
      [SPECIALTIES_FILTER_KEY]: filterValues[SPECIALTIES_FILTER_KEY],
      [APPOINTMENT_FEE_FILTER_KEY]: filterValues[APPOINTMENT_FEE_FILTER_KEY],
    }
  }, [filterValues])

  const isBusy = isLoading || isFetching || isRouteRefreshPending

  return (
    <section className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-cyan-50 via-white to-blue-50 p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-cyan-200/30 blur-2xl" />
        <div className="relative space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Consult With Our Specialists</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Discover trusted doctors, compare experience and fees, and open detailed profiles to find the right specialist.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          <DataTableSearch
            key={searchTermFromUrl}
            initialValue={searchTermFromUrl}
            placeholder="Search doctor by name, qualification, email..."
            debounceMs={700}
            onDebouncedChange={handleDebouncedSearchChange}
            isLoading={isBusy}
          />

          <DataTableFilters
            filters={filterConfigs}
            values={filterValuesForControls}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
            isLoading={isBusy}
          />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort</span>
            <Select
              value={optimisticSortingState[0]?.id ? `${optimisticSortingState[0]?.id}:${optimisticSortingState[0]?.desc ? "desc" : "asc"}` : "default"}
              onValueChange={(value) => {
                if (value === "default") {
                  handleSortingChange([])
                  return
                }

                const [sortBy, sortOrder] = value.split(":")
                handleSortingChange([{ id: sortBy, desc: sortOrder === "desc" }])
              }}
            >
              <SelectTrigger className="w-55" disabled={isBusy}>
                <SelectValue placeholder="Sort doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="averageRating:desc">Rating (High to Low)</SelectItem>
                <SelectItem value="appointmentFee:asc">Fee (Low to High)</SelectItem>
                <SelectItem value="experience:desc">Experience (High to Low)</SelectItem>
                <SelectItem value="createdAt:desc">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isBusy && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Loading doctors...
        </div>
      )}

      {!isBusy && doctors.length === 0 && (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No doctors found for your current search/filter.
        </div>
      )}

      {!isBusy && doctors.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor: IDoctor) => {
              const specialtiesList = doctor.specialties?.map((item) => item.specialty.title) ?? []

              return (
                <article
                  key={String(doctor.id)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute left-0 top-0 h-1 w-full bg-linear-to-r from-cyan-500 via-sky-500 to-blue-500 opacity-80" />
                  <div className="flex items-start gap-3">
                    <Avatar className="size-14 ring-2 ring-blue-100">
                      <AvatarImage src={doctor.profilePhoto} alt={doctor.name} />
                      <AvatarFallback>{getDoctorInitials(doctor.name)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-1">
                      <h3 className="truncate text-base font-semibold">{doctor.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{doctor.designation || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{doctor.currentWorkingPlace || "N/A"}</p>
                      <p className="truncate text-xs text-muted-foreground">{doctor.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-lg bg-muted/40 p-3 text-sm">
                    <p>
                      <span className="font-medium">Experience:</span> {doctor.experience ?? 0} years
                    </p>
                    <p>
                      <span className="font-medium">Fee:</span> ${doctor.appointmentFee?.toFixed(2) ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Rating:</span> {doctor.averageRating?.toFixed(1) ?? "0.0"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {specialtiesList.length > 0 ? (
                      specialtiesList.slice(0, 3).map((title) => (
                        <Badge key={`${doctor.id}-${title}`} variant="secondary">
                          {title}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">No specialties</Badge>
                    )}
                  </div>

                  <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                    <BookAppointmentModal
                      doctorId={String(doctor.id)}
                      doctorName={doctor.name}
                      isAuthenticated={isAuthenticated}
                      viewerRole={viewerRole}
                      triggerClassName="w-full"
                      fullWidth
                    />
                    <Button asChild className="w-full">
                      <Link href={`/consultation/doctor/${doctor.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="space-y-3 pt-2">
            <Pagination
              currentPage={optimisticPaginationState.pageIndex + 1}
              totalPages={meta?.totalPages ?? 1}
              isLoading={isBusy}
              onPageChange={(page) => {
                handlePaginationChange({
                  pageIndex: page - 1,
                  pageSize: optimisticPaginationState.pageSize,
                })
              }}
            />

            <p className="text-center text-sm text-muted-foreground">
              Total {meta?.total ?? doctors.length} doctors
            </p>
          </div>
        </>
      )}
    </section>
  )
}

export default DoctorsList