"use client";

import {
  DataTableFilterValue,
  DataTableFilterValues,
  DataTableRangeValue,
  RangeOperator,
} from "@/components/shared/table/DataTableFilters";
import { useCallback, useMemo } from "react";
import { UpdateParamsFn } from "./useServerManagedDataTable";
import { ReadonlyURLSearchParams } from "next/navigation";

const DEFAULT_RANGE_OPERATORS: RangeOperator[] = ["gte", "lte"];

interface BaseServerManagedFilterDefinition {
  filterId: string;
}

interface SingleFilterDefinition extends BaseServerManagedFilterDefinition {
  type: "single";
  queryKey: string;
}

interface MultiFilterDefinition extends BaseServerManagedFilterDefinition {
  type: "multi";
  queryKey: string;
}

interface RangeFilterDefinition extends BaseServerManagedFilterDefinition {
  type: "range";
  queryKey: string;
  operators?: RangeOperator[];
}

export type ServerManagedFilterDefinition =
  | SingleFilterDefinition
  | MultiFilterDefinition
  | RangeFilterDefinition;

export const serverManagedFilter = {
  single: (filterId: string, queryKey: string = filterId): SingleFilterDefinition => ({
    filterId,
    type: "single",
    queryKey,
  }),
  multi: (filterId: string, queryKey: string = filterId): MultiFilterDefinition => ({
    filterId,
    type: "multi",
    queryKey,
  }),
  range: (
    filterId: string,
    queryKey: string = filterId,
    operators?: RangeOperator[],
  ): RangeFilterDefinition => ({
    filterId,
    type: "range",
    queryKey,
    operators,
  }),
};

interface UseServerManagedDataTableFiltersParams {
  searchParams: ReadonlyURLSearchParams;
  definitions: ServerManagedFilterDefinition[];
  updateParams: UpdateParamsFn;
}

const getRangeParamKey = (queryKey: string, operator: RangeOperator) => {
  return `${queryKey}[${operator}]`;
};

export const useServerManagedDataTableFilters = ({
  searchParams,
  definitions,
  updateParams,
}: UseServerManagedDataTableFiltersParams) => {
  const filterValues = useMemo<DataTableFilterValues>(() => {
    return definitions.reduce<DataTableFilterValues>((acc, definition) => {
      if (definition.type === "single") {
        acc[definition.filterId] = searchParams.get(definition.queryKey) ?? "";
        return acc;
      }

      if (definition.type === "multi") {
        acc[definition.filterId] = searchParams.getAll(definition.queryKey);
        return acc;
      }

      const operators = definition.operators ?? DEFAULT_RANGE_OPERATORS;
      const rangeValue: DataTableRangeValue = {};

      operators.forEach((operator) => {
        rangeValue[operator] = searchParams.get(getRangeParamKey(definition.queryKey, operator)) ?? "";
      });

      acc[definition.filterId] = rangeValue;
      return acc;
    }, {});
  }, [definitions, searchParams]);

  const handleFilterChange = useCallback((filterId: string, value: DataTableFilterValue | undefined) => {
    const definition = definitions.find((item) => item.filterId === filterId);

    if (!definition) {
      return;
    }

    updateParams((params) => {
      if (definition.type === "single") {
        const nextValue = typeof value === "string" ? value.trim() : "";
        if (nextValue) {
          params.set(definition.queryKey, nextValue);
          return;
        }

        params.delete(definition.queryKey);
        return;
      }

      if (definition.type === "multi") {
        params.delete(definition.queryKey);

        const nextValues = Array.isArray(value) ? value : [];
        nextValues.forEach((item) => {
          if (typeof item === "string" && item.length > 0) {
            params.append(definition.queryKey, item);
          }
        });
        return;
      }

      const operators = definition.operators ?? DEFAULT_RANGE_OPERATORS;
      operators.forEach((operator) => {
        params.delete(getRangeParamKey(definition.queryKey, operator));
      });

      const rangeValue =
        value && !Array.isArray(value) && typeof value === "object"
          ? (value as DataTableRangeValue)
          : {};

      operators.forEach((operator) => {
        const operatorValue = rangeValue[operator]?.trim();
        if (operatorValue) {
          params.set(getRangeParamKey(definition.queryKey, operator), operatorValue);
        }
      });
    }, { resetPage: true });
  }, [definitions, updateParams]);

  const clearAllFilters = useCallback(() => {
    updateParams((params) => {
      definitions.forEach((definition) => {
        if (definition.type === "single" || definition.type === "multi") {
          params.delete(definition.queryKey);
          return;
        }

        const operators = definition.operators ?? DEFAULT_RANGE_OPERATORS;
        operators.forEach((operator) => {
          params.delete(getRangeParamKey(definition.queryKey, operator));
        });
      });
    }, { resetPage: true });
  }, [definitions, updateParams]);

  return {
    filterValues,
    handleFilterChange,
    clearAllFilters,
  };
};
