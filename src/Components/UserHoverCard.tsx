import React, {PropsWithChildren, ReactNode} from 'react';
import {User} from "@/Tools/Interfaces/userInterfaces";
import {Avatar, AvatarFallback, AvatarImage} from "@/Components/ui/avatar";
import {HoverCard, HoverCardContent, HoverCardTrigger} from "@/Components/ui/hover-card";

interface UserHoverCardProps {
    user: User;
    children: ReactNode;
}

export const UserHoverCard: React.FC<UserHoverCardProps> = ({
                                                                children,
                                                                ...props
                                                            }: PropsWithChildren<UserHoverCardProps>) => {
    const {user} = props;
    return (
        <HoverCard>
            <HoverCardTrigger>
                {children}
            </HoverCardTrigger>
            <HoverCardContent>
                <div className={"inline-flex gap-4"}>
                    <Avatar>
                        <AvatarImage src={user.images[0].url} alt="User avatar"/>
                        <AvatarFallback>{user.display_name}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={"font-bold"}>{user.display_name}</p>
                        <p className={"text-sm text-muted-foreground"}>@{user.id}</p>
                        <p>Music should be happy.</p>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
};