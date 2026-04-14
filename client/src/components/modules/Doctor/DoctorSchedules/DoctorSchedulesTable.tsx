"use client"

import DataTable from "@/components/shared/table/DataTable"
import {
    DataTableFilterConfig,
    DataTableFilterValues,
} from "@/components/shared/table/DataTableFilters"
import { useRowActionModalState } from "@/hooks/useRowActionModalState"
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable"
import {
    serverManagedFilter,
    useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters"
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch"
import { getMyDoctorSchedules } from "@/services/doctorSchedule.services"
import { PaginationMeta } from "@/types/api.types"
import { type IDoctorSchedule } from "@/types/doctorSchedule.types"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import BookScheduleModal from "./BookScheduleModal"
import DeleteMyScheduleConfirmationDialog from "./DeleteMyScheduleConfirmationDialog"
import { doctorSchedulesColumns } from "./doctorSchedulesColumns"
import ViewMyScheduleDialog from "./ViewMyScheduleDialog"

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

const DOCTOR_SCHEDULE_FILTER_DEFINITIONS = [
	serverManagedFilter.single("isBooked"),
]

const DoctorSchedulesTable = ({ initialQueryString }: { initialQueryString: string }) => {
	const searchParams = useSearchParams()
	const {
		viewingItem,
		deletingItem,
		isViewDialogOpen,
		isDeleteDialogOpen,
		onViewOpenChange,
		onDeleteOpenChange,
		tableActions,
	} = useRowActionModalState<IDoctorSchedule>({ enableEdit: false })

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

	const queryString = queryStringFromUrl || initialQueryString

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
		definitions: DOCTOR_SCHEDULE_FILTER_DEFINITIONS,
		updateParams,
	})

	const { data: doctorSchedulesResponse, isLoading, isFetching } = useQuery({
		queryKey: ["my-doctor-schedules", queryString],
		queryFn: () => getMyDoctorSchedules(queryString),
	})

	const doctorSchedules = doctorSchedulesResponse?.data ?? []
	const meta: PaginationMeta | undefined = doctorSchedulesResponse?.meta
	const bookedCount = doctorSchedules.filter((item) => item.isBooked).length
	const availableCount = doctorSchedules.length - bookedCount

	const filterConfigs = useMemo<DataTableFilterConfig[]>(() => {
		return [
			{
				id: "isBooked",
				label: "Status",
				type: "single-select",
				options: [
					{ label: "Booked", value: "true" },
					{ label: "Available", value: "false" },
				],
			},
		]
	}, [])

	const filterValuesForTable = useMemo<DataTableFilterValues>(() => {
		return {
			isBooked: filterValues.isBooked,
		}
	}, [filterValues])

	return (
		<>
			<div className="space-y-5">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">My Schedules</h1>
					<p className="text-sm text-muted-foreground">
						Track your assigned slots and book upcoming schedules from admin-created availability.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
						Total: {meta?.total ?? doctorSchedules.length}
					</div>
					<div className="rounded-full border bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
						Available: {availableCount}
					</div>
					<div className="rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
						Booked: {bookedCount}
					</div>
				</div>

				<div className="rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
					<DataTable
						data={doctorSchedules}
						columns={doctorSchedulesColumns}
						isLoading={isLoading || isFetching || isRouteRefreshPending}
						emptyMessage="No schedules assigned yet."
						sorting={{
							state: optimisticSortingState,
							onSortingChange: handleSortingChange,
						}}
						pagination={{
							state: optimisticPaginationState,
							onPaginationChange: handlePaginationChange,
						}}
						search={{
							initialValue: searchTermFromUrl,
							placeholder: "Search by doctor id, schedule id...",
							debounceMs: 700,
							onDebouncedChange: handleDebouncedSearchChange,
						}}
						filters={{
							configs: filterConfigs,
							values: filterValuesForTable,
							onFilterChange: handleFilterChange,
							onClearAll: clearAllFilters,
						}}
						toolbarAction={<BookScheduleModal />}
						meta={meta}
						actions={tableActions}
					/>
				</div>
			</div>

			<DeleteMyScheduleConfirmationDialog
				open={isDeleteDialogOpen}
				onOpenChange={onDeleteOpenChange}
				doctorSchedule={deletingItem}
			/>

			<ViewMyScheduleDialog
				open={isViewDialogOpen}
				onOpenChange={onViewOpenChange}
				doctorSchedule={viewingItem}
			/>
		</>
	)
}

export default DoctorSchedulesTable
