import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserInfo } from "@/types/user.types"
import { Key, LogOut, User } from "lucide-react"
import Link from "next/link"

interface UserDropdownProps{
    userInfo : UserInfo
}

const UserDropdown = ({ userInfo }: UserDropdownProps) => {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant={"outline"} size={"icon"} className="rounded-full">
                <span className="text-sm font-semibold">
                    {userInfo.name.charAt(0).toUpperCase()}
                </span>
            </Button>
        </DropdownMenuTrigger>


        <DropdownMenuContent align={"end"} className="w-56">
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                        {userInfo.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {userInfo.email}
                    </p>

                    <p className="text-xs text-primary capitalize">
                        {userInfo.role.toLowerCase().replace("_", " ")}
                    </p>
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator/>

            <DropdownMenuItem>
                <Link href={"/my-profile"}>
                <User className="mr-2 h-4 w-4"/>
                    My Profile
                </Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
                <Link href={"/change-password"}>
                    <Key className="mr-2 h-4 w-4"/>
                    Change Password
                </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator/>


            <DropdownMenuItem onClick={() => {}} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4"/>
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserDropdown