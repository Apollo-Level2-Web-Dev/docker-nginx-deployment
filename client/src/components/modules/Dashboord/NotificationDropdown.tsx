"use client"

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Bell, Calendar, CheckCircle, Clock, UserPlus } from "lucide-react";

interface Notification {
    id: string;
    title: string;
    message: string;
    type : "appointment" | "schedule" | "system" | "user";
    timestamp: Date;
    read : boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        title: "New Appointment Scheduled",
        message: "You have a new appointment scheduled with John Doe on 2024-06-15 at 10:00 AM.",
        type : "appointment",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read : false
    },

    {
        id: "2",
        title: "Schedule Updated",
        message: "Your schedule has been updated for the week of 2024-06-17.",
        type : "schedule",
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        read : true
    },

    {
        id: "3",
        title: "System Maintenance",
        message: "The system will undergo maintenance on 2024-06-20 from 1:00 AM to 3:00 AM.",
        type : "system",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read : false
    },

    {
        id: "4",
        title: "New User Registered",
        message: "A new user, Jane Smith, has registered on the platform.",
        type : "user",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        read : true
    }
]

const getNotificationIcon = (type : Notification["type"]) => {
    switch(type){
        case "appointment":
            return <Calendar className="h-4 w-4 text-blue-600"/>
        case "schedule":
            return <Clock className="h-4 w-4 text-amber-600"/>
        case "system":
            return <CheckCircle className="h-4 w-4 text-purple-600"/>
        case "user":
            return <UserPlus className="h-4 w-4 text-green-600"/>
        default:
            return <Bell className="h-4 w-4 text-gray-600"/>
    }
}



const NotificationDropdown = () => {

    const unreadCount = MOCK_NOTIFICATIONS.filter(notification => !notification.read).length;
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={"outline"} size={"icon"} className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded full p-0 flex items-center justify-center" variant={"destructive"}>
                    <span className="text-[10px">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                </Badge>
            </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align={"end"} className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
                <span>
                    Notifications
                </span>
                {
                    unreadCount > 0 && (
                        <Badge variant={"secondary"} className="ml-2">
                            {unreadCount} new
                        </Badge>
                    )
                }
            </DropdownMenuLabel>

            <DropdownMenuSeparator/>

            <ScrollArea className="h-75">
                {
                    MOCK_NOTIFICATIONS.length > 0 ? (
                        MOCK_NOTIFICATIONS.map(notification => (
                            <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-2 p-3 cursor-pointer">
                                <div className="mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        {
                                            !notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-600"/>
                                            )
                                        }
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(notification.timestamp, {
                                            addSuffix: true
                                        })}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) 
                }
            </ScrollArea>

            <DropdownMenuSeparator/>

            <DropdownMenuItem className="text-center justify-center cursor-pointer">
                View All Notifications
            </DropdownMenuItem>
        </DropdownMenuContent>

    </DropdownMenu>
  )
}

export default NotificationDropdown