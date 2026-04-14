import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

export const getIconComponent = (iconName : string) : LucideIcon => {
    const IconComponent = Icons[iconName as keyof typeof Icons]

    if(!IconComponent){
        return Icons.HelpCircle
    }

    return IconComponent as LucideIcon
}