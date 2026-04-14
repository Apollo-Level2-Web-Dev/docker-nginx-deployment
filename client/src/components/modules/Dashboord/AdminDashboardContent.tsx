"use client"

import AppointmentBarChart from "@/components/shared/AppointmentBarChart"
import AppointmentPieChart from "@/components/shared/AppointmentPieChart"
import StatsCard from "@/components/shared/StatsCard"
import { getDashboardData } from "@/services/dashboard.services"
import { ApiResponse } from "@/types/api.types"
import { IAdminDashboardData } from "@/types/dashboard.types"
import { useQuery } from "@tanstack/react-query"

const AdminDashboardContent = () => {
  const { data: adminDashboardData } = useQuery({
    queryKey: ["admin-dashboard-data"],
    queryFn: getDashboardData,
    refetchOnWindowFocus: "always", // Refetch the data when the window regains focus
  });

  const { data } = adminDashboardData as ApiResponse<IAdminDashboardData>;
  //http://localhost:5000/api/v1/doctors?page=1&limit=2&searchTerm=ortho&appointmentFee[gt]=1000&appointmentFee[lte]=1500&fields=name,email&sortBy=user.name.firstName&sortOrder=asc&experience[gt]=7&include=specialties&user.role=DOCTOR&specialties.specialty.title=Neurology&gender=MALE&specialties.specialty.title=Cardiology2
  return (
    <div>
      <StatsCard
        title="Total Appointments"
        value={data?.appointmentCount || 0}
        iconName="CalendarDays"
        description="Number of appointments scheduled"
      />
      <StatsCard
        title="Total Patients"
        value={data?.patientCount || 0}
        iconName="Users"
        description="Number of patients registered"
      />

      <AppointmentBarChart data={data?.barChartData || []} />

      <AppointmentPieChart data={data?.pieChartData || []} />
    </div>
  );
}

export default AdminDashboardContent