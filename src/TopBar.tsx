import React, {useEffect} from 'react';
import {BlurOn} from "@mui/icons-material";
import {useAuth} from "@/Authentication/AuthContext";
import {Link} from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/Components/ui/dropdown-menu";
import {Avatar, AvatarImage} from "@/Components/ui/avatar";
import {LogOut, Settings, Star, User2} from "lucide-react";
import {Button} from "@/Components/ui/button";
import {Input} from "@/Components/ui/input";
import {User} from "@/Tools/Interfaces/userInterfaces";
import {debounceAsync} from "@/Tools/utils";
import {searchUsers} from "@/Tools/users";
import {DatabaseUser} from "@/Tools/Interfaces/databaseInterfaces";

const UserDropdown = (props: { user: User }) => {
    const {user} = props
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage src={user.images[0].url}/>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <DropdownMenuItem>
                    <Link className={'inline-flex items-center'} to={`/profile/${user.id}`}>
                        <User2 className="mr-2 h-4 w-4"/>
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Link className={'inline-flex items-center'} to={'/settings#account'}>
                        <Settings className="mr-2 h-4 w-4"/>
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <Button className={"w-full h-fit px-2 py-1.5"} variant={"ghost"} asChild>
                    <DropdownMenuItem className={"inline-flex items-center justify-start"}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        <span>Logout</span>
                    </DropdownMenuItem>
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const TopBar = () => {
    const {user, isAuthenticated} = useAuth()

    const [query, setQuery] = React.useState<string>('')
    const [searchResults, setSearchResults] = React.useState<DatabaseUser[]>([])
    const debouncedSearchUsers = debounceAsync(searchUsers, 500);

    useEffect(() => {
        if (query !== '') {
            debouncedSearchUsers(query).then(res => setSearchResults(res));
        } else {
            setSearchResults([]);
        }
    }, [query])


    return (
        <header className={'fixed flex top-0 left-0 w-full bg-background border-b z-10'}>
            <div className={"inline-flex flex-row flex-grow p-4 justify-between"}>
                <Link to={"/"}>
                    <h1 className={"inline-flex justify-center"}>
                        <BlurOn fontSize={'large'}/>
                        <span className={"text-3xl font-bold hidden sm:block"}>Harked</span>
                    </h1>
                </Link>

                <div className={"inline-flex gap-4"}>
                    <div className={"relative"}>
                        <Input onChange={(e) => setQuery(e.target.value)} className={"peer focus-visible:ring-0"} type={"search"}
                               placeholder="Search users"/>
                        {searchResults.length > 0 &&
                            <div
                                className={"absolute top-full -mt-2 p-4 rounded-b border border-t-0 w-full backdrop-blur"}>
                                {searchResults.map((userResult, index) => (
                                    <div key={index}>
                                        <a href={`/profile/${userResult.user_id}`}>
                                            <p className={"font-bold"}>{userResult.username}</p>
                                            <p className={"text-sm text-muted-foreground"}>@{userResult.user_id}</p>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>


                    {isAuthenticated &&
                        <UserDropdown user={user}/>
                    }
                </div>

            </div>
        </header>
    )
}

export default TopBar