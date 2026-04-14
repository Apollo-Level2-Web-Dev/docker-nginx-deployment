"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { useMemo, useState } from "react";

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export type RangeOperator = "gte" | "lte";

interface BaseFilterConfig {
  id: string;
  label: string;
}

export interface SingleSelectFilterConfig extends BaseFilterConfig {
  type: "single-select";
  options: DataTableFilterOption[];
}

export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: "multi-select";
  options: DataTableFilterOption[];
}

export interface RangeFilterConfig extends BaseFilterConfig {
  type: "range";
}

export type DataTableFilterConfig =
  | SingleSelectFilterConfig
  | MultiSelectFilterConfig
  | RangeFilterConfig;

export type DataTableRangeValue = Partial<Record<RangeOperator, string>>;

export type DataTableFilterValue = string | string[] | DataTableRangeValue;

export type DataTableFilterValues = Record<string, DataTableFilterValue | undefined>;

interface DataTableFiltersProps {
  filters: DataTableFilterConfig[];
  values: DataTableFilterValues;
  onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
}

const RANGE_OPERATOR_LABEL: Record<RangeOperator, string> = {
  gte: "Min",
  lte: "Max",
};

const isRangeValue = (value: DataTableFilterValue | undefined): value is DataTableRangeValue => {
  return !!value && !Array.isArray(value) && typeof value === "object";
};

const getFilterActiveCount = (
  filter: DataTableFilterConfig,
  value: DataTableFilterValue | undefined,
): number => {
  if (!value) {
    return 0;
  }

  if (filter.type === "single-select") {
    return typeof value === "string" && value.length > 0 ? 1 : 0;
  }

  if (filter.type === "multi-select") {
    return Array.isArray(value) ? value.length : 0;
  }

  if (isRangeValue(value)) {
    return Object.values(value).filter((item) => item && item.length > 0).length;
  }

  return 0;
};

const MultiSelectFilterControl = ({
  filter,
  value,
  isLoading,
  onFilterChange,
}: {
  filter: MultiSelectFilterConfig;
  value: string[];
  isLoading?: boolean;
  onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(value);

  const applyNow = () => {
    onFilterChange(
      filter.id,
      selectedValues.length > 0 ? selectedValues : undefined,
    );
  };

  return (
    <div className="space-y-3">
      <div className="max-h-52 space-y-2 overflow-auto pr-1">
        {filter.options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(checkedState) => {
                  const nextValues = checkedState
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((item) => item !== option.value);

                  setSelectedValues(nextValues);
                }}
                disabled={isLoading}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setSelectedValues([])}
          disabled={isLoading}
        >
          Clear
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={applyNow}
          disabled={isLoading}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

const SingleSelectFilterControl = ({
  filter,
  value,
  isLoading,
  onFilterChange,
}: {
  filter: SingleSelectFilterConfig;
  value: string;
  isLoading?: boolean;
  onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
}) => {
  return (
    <div className="space-y-3">
      <Select
        value={value || "all"}
        onValueChange={(nextValue) => {
          onFilterChange(filter.id, nextValue === "all" ? undefined : nextValue);
        }}
      >
        <SelectTrigger disabled={isLoading}>
          <SelectValue placeholder={filter.label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {filter.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const RANGE_OPERATORS: RangeOperator[] = ["gte", "lte"];

const RangeFilterControl = ({
  filter,
  value,
  isLoading,
  onFilterChange,
}: {
  filter: RangeFilterConfig;
  value: DataTableRangeValue;
  isLoading?: boolean;
  onFilterChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
}) => {
  const [rangeValue, setRangeValue] = useState<DataTableRangeValue>(value);

  const applyNow = () => {
    const hasAnyValue = RANGE_OPERATORS.some((operator) => rangeValue[operator]?.trim());
    onFilterChange(filter.id, hasAnyValue ? rangeValue : undefined);
  };

  const clearRange = () => {
    setRangeValue({});
    onFilterChange(filter.id, undefined);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {RANGE_OPERATORS.map((operator) => (
          <div key={operator} className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              {RANGE_OPERATOR_LABEL[operator]}
            </Label>
            <Input
              type="number"
              value={rangeValue[operator] ?? ""}
              onChange={(event) => {
                const nextValue = event.target.value;
                setRangeValue((prevValue) => ({
                  ...prevValue,
                  [operator]: nextValue,
                }));
              }}
              placeholder="0"
              disabled={isLoading}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearRange}
          disabled={isLoading}
        >
          Clear
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={applyNow}
          disabled={isLoading}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

type ActiveBadge = {
  key: string;
  label: string;
  onRemove: () => void;
};

const DataTableFilters = ({
  filters,
  values,
  onFilterChange,
  onClearAll,
  isLoading,
}: DataTableFiltersProps) => {
  const totalActiveFilters = useMemo(() => {
    return filters.reduce((totalCount, filter) => {
      return totalCount + getFilterActiveCount(filter, values[filter.id]);
    }, 0);
  }, [filters, values]);

  const activeBadges = useMemo<ActiveBadge[]>(() => {
    const badges: ActiveBadge[] = [];
    for (const filter of filters) {
      const filterValue = values[filter.id];

      if (filter.type === "single-select") {
        if (typeof filterValue === "string" && filterValue.length > 0) {
          const option = filter.options.find((o) => o.value === filterValue);
          badges.push({
            key: `${filter.id}:${filterValue}`,
            label: `${filter.label}: ${option?.label ?? filterValue}`,
            onRemove: () => onFilterChange(filter.id, undefined),
          });
        }
      }

      if (filter.type === "multi-select" && Array.isArray(filterValue)) {
        for (const val of filterValue) {
          const option = filter.options.find((o) => o.value === val);
          badges.push({
            key: `${filter.id}:${val}`,
            label: `${filter.label}: ${option?.label ?? val}`,
            onRemove: () => {
              const next = (filterValue as string[]).filter((v) => v !== val);
              onFilterChange(filter.id, next.length > 0 ? next : undefined);
            },
          });
        }
      }

      if (filter.type === "range" && isRangeValue(filterValue)) {
        for (const op of RANGE_OPERATORS) {
          const val = filterValue[op]?.trim();
          if (val) {
            badges.push({
              key: `${filter.id}:${op}`,
              label: `${filter.label}: ${RANGE_OPERATOR_LABEL[op]} ${val}`,
              onRemove: () => {
                const next: DataTableRangeValue = { ...filterValue, [op]: "" };
                const hasAny = RANGE_OPERATORS.some((o) => next[o]?.trim());
                onFilterChange(filter.id, hasAny ? next : undefined);
              },
            });
          }
        }
      }
    }
    return badges;
  }, [filters, values, onFilterChange]);

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const filterValue = values[filter.id];
        const activeCount = getFilterActiveCount(filter, filterValue);
        const triggerClass = cn(
          "h-9",
          activeCount > 0 && "border-primary text-primary",
        );

        return (
          <Popover key={`${filter.id}-${JSON.stringify(filterValue ?? null)}`}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={triggerClass} disabled={isLoading}>
                {filter.label}
                {activeCount > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5" variant="secondary">
                    {activeCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{filter.label}</h3>
              </div>

              {filter.type === "single-select" && (
                <SingleSelectFilterControl
                  filter={filter}
                  value={typeof filterValue === "string" ? filterValue : ""}
                  isLoading={isLoading}
                  onFilterChange={onFilterChange}
                />
              )}

              {filter.type === "multi-select" && (
                <MultiSelectFilterControl
                  filter={filter}
                  value={Array.isArray(filterValue) ? filterValue : []}
                  isLoading={isLoading}
                  onFilterChange={onFilterChange}
                />
              )}

              {filter.type === "range" && (
                <RangeFilterControl
                  filter={filter}
                  value={isRangeValue(filterValue) ? filterValue : {}}
                  isLoading={isLoading}
                  onFilterChange={onFilterChange}
                />
              )}
            </PopoverContent>
          </Popover>
        );
      })}

      {onClearAll && totalActiveFilters > 0 && (
        <Button
          type="button"
          variant="ghost"
          className="h-9"
          onClick={onClearAll}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>{totalActiveFilters} active</span>
        </div>
      </div>

      {activeBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeBadges.map((badge) => (
            <Badge
              key={badge.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1 text-xs"
            >
              {badge.label}
              <button
                type="button"
                onClick={badge.onRemove}
                disabled={isLoading}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 disabled:pointer-events-none"
                aria-label={`Remove ${badge.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTableFilters;
