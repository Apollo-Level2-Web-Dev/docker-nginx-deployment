"use client";

import DataTable from "@/components/shared/table/DataTable";
import {
  DataTableFilterConfig,
  DataTableFilterValues,
} from "@/components/shared/table/DataTableFilters";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { getAllSpecialties, getDoctors } from "@/services/doctor.services";
import { PaginationMeta } from "@/types/api.types";
import { IDoctor } from "@/types/doctor.types";
import { ISpecialty } from "@/types/specialty.types";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import CreateDoctorFormModal from "./CreateDoctorFormModal";
import DeleteDoctorConfirmationDialog from "./DeleteDoctorConfirmationDialog";
import EditDoctorFormModal from "./EditDoctorFormModal";
import ViewDoctorProfileDialog from "./ViewDoctorProfileDialog";
import { doctorColumns } from "./doctorsColumns";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const SPECIALTIES_FILTER_KEY = "specialties.specialty.title";
const APPOINTMENT_FEE_FILTER_KEY = "appointmentFee";
const DOCTOR_FILTER_DEFINITIONS = [
  serverManagedFilter.single("gender"),
  serverManagedFilter.multi(SPECIALTIES_FILTER_KEY),
  serverManagedFilter.range(APPOINTMENT_FEE_FILTER_KEY),
];


const DoctorsTable = ({ initialQueryString }: { initialQueryString: string }) => {
    const searchParams = useSearchParams();
    const {
      viewingItem,
      editingItem,
      deletingItem,
      isViewDialogOpen,
      isEditModalOpen,
      isDeleteDialogOpen,
      onViewOpenChange,
      onEditOpenChange,
      onDeleteOpenChange,
      tableActions,
    } = useRowActionModalState<IDoctor>();

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
    });

    const queryString = queryStringFromUrl || initialQueryString;

    const {
      searchTermFromUrl,
      handleDebouncedSearchChange,
    } = useServerManagedDataTableSearch({
      searchParams,
      updateParams,
    });

    const {
      filterValues,
      handleFilterChange,
      clearAllFilters,
    } = useServerManagedDataTableFilters({
      searchParams,
      definitions: DOCTOR_FILTER_DEFINITIONS,
      updateParams,
    });

    const { data : doctorDataResponse, isLoading, isFetching } = useQuery({
      queryKey: ["doctors", queryString],
      queryFn: () => getDoctors(queryString)
    });

    const { data: specialtiesResponse, isLoading: isLoadingSpecialties } = useQuery({
      queryKey: ["specialties"],
      queryFn: getAllSpecialties,
      staleTime: 1000 * 60 * 60 * 6,
      gcTime: 1000 * 60 * 60 * 24,
    });

    const doctors = doctorDataResponse?.data ?? [];
    const specialties = useMemo<ISpecialty[]>(() => {
      return specialtiesResponse?.data ?? [];
    }, [specialtiesResponse]);
    const meta: PaginationMeta | undefined = doctorDataResponse?.meta;

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
          options: specialties.map((specialty) => ({
            label: specialty.title,
            value: specialty.title,
          })),
        },
        {
          id: "appointmentFee",
          label: "Fee Range",
          type: "range",
        },
      ];
    }, [specialties]);

    const filterValuesForTable = useMemo<DataTableFilterValues>(() => {
      return {
        gender: filterValues.gender,
        [SPECIALTIES_FILTER_KEY]: filterValues[SPECIALTIES_FILTER_KEY],
        appointmentFee: filterValues[APPOINTMENT_FEE_FILTER_KEY],
      };
    }, [filterValues]);

    return (
      <>
        <DataTable
          data={doctors}
          columns={doctorColumns}
          isLoading={isLoading || isFetching || isRouteRefreshPending}
          emptyMessage="No doctors found."
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
            placeholder: "Search doctor by name, email...",
            debounceMs: 700,
            onDebouncedChange: handleDebouncedSearchChange,
          }}
          filters={{
            configs: filterConfigs,
            values: filterValuesForTable,
            onFilterChange: handleFilterChange,
            onClearAll: clearAllFilters,
          }}
          toolbarAction={
            <CreateDoctorFormModal
              specialties={specialties}
              isLoadingSpecialties={isLoadingSpecialties}
            />
          }
          meta={meta}
          actions={tableActions}
        />

        <EditDoctorFormModal
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          doctor={editingItem}
          specialties={specialties}
          isLoadingSpecialties={isLoadingSpecialties}
        />

        <DeleteDoctorConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={onDeleteOpenChange}
          doctor={deletingItem}
        />

        <ViewDoctorProfileDialog
          open={isViewDialogOpen}
          onOpenChange={onViewOpenChange}
          doctor={viewingItem}
        />
      </>
    )

}
export default DoctorsTable