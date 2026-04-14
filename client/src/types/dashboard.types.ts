export interface NavItem {
    title : string,
    href : string,
    icon : string
}

export interface NavSection {
    title ?: string,
    items : NavItem[]
}

export interface PieChartData {
    status: string,
    count: number
}

export interface BarChartData {
    month: Date | string,
    count: number
}

export interface IAdminDashboardData {
    appointmentCount : number;
    patientCount : number;
    doctorCount : number;
    adminCount : number;
    superAdminCount : number;
    paymentCount : number;
    userCount : number;
    totalRevenue : number;
    barChartData : BarChartData[];
    pieChartData : PieChartData[];
}
