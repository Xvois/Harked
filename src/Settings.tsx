import {Avatar, AvatarImage} from "@/Components/ui/avatar";
import {Button} from "@/Components/ui/button";
import {Link, useLocation} from "react-router-dom";
import {Label} from "@/Components/ui/label";
import {Input} from "@/Components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/Components/ui/select";
import {Switch} from "@/Components/ui/switch";
import React from "react";
import {BadgePlus, Bell, Lock, Sun, User2, UserRoundX} from "lucide-react";
import {useAuth} from "@/Authentication/AuthContext";
import {Separator} from "@/Components/ui/separator";

export default function Settings() {
    const {user, isAuthenticated} = useAuth()
    const location = useLocation();


    React.useEffect(() => {
        const hash = location.hash;
        const sections = document.querySelectorAll('section');

        sections.forEach((section) => {
            if ('#' + section.id === hash) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    }, [location]);

    return (
        <div>
            <div>
                <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                            <AvatarImage alt="Avatar" src={user?.images[0].url}/>
                        </Avatar>
                        <div className="grid gap-1">
                            <h1 className="text-2xl font-bold">{user?.display_name}</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex">
                <div className="w-60 border-r">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-4">
                        <Link
                            className="flex items-center p-2 rounded-md text-sm font-medium hover:bg-gray-100 hover:dark:bg-gray-800"
                            to={"#account"}
                        >
                            <User2 className="mr-2 h-4 w-4"/>
                            Account
                        </Link>
                        <Link
                            className="flex items-center p-2 rounded-md text-sm font-medium hover:bg-gray-100 hover:dark:bg-gray-800"
                            to="#privacy"
                        >
                            <Lock className="mr-2 h-4 w-4"/>
                            Privacy
                        </Link>
                        <Link
                            className="flex items-center p-2 rounded-md text-sm font-medium hover:bg-gray-100 hover:dark:bg-gray-800"
                            to="#notifications"
                        >
                            <Bell className="mr-2 h-4 w-4"/>
                            Notifications
                        </Link>
                        <Link
                            className="flex items-center p-2 rounded-md text-sm font-medium hover:bg-gray-100 hover:dark:bg-gray-800"
                            to="#appearance"
                        >
                            <Sun className="mr-2 h-4 w-4"/>
                            Appearance
                        </Link>
                        <Separator/>
                        <Button variant={"destructive"}
                                className="flex items-center p-2 rounded-md text-sm font-medium w-full">
                            <UserRoundX className="mr-2 h-4 w-4"/>
                            Delete Account
                        </Button>
                    </nav>
                </div>
                <div className="flex-1 p-4">
                    <section className="space-y-4" id="account">
                        <h2 className="text-2xl font-semibold">Account</h2>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" className={'w-fit'} disabled readOnly value={user?.display_name}/>
                                <p className={"text-sm text-muted-foreground"}>This is the name used on your profile and
                                    any other public activities to make.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">ID</Label>
                                <Input id="email" className={'w-fit'} disabled readOnly value={user?.id}/>
                                <p className={"text-sm text-muted-foreground"}>This is used to uniquely identify you
                                    across every user on Spotify.</p>
                            </div>
                            <p className={"text-sm underline"}>Why can't I change these?</p>
                        </div>
                    </section>
                    <section className="space-y-4 hidden" id="privacy">
                        <h2 className="text-2xl font-semibold">Privacy</h2>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Profile visibility</Label>
                                <Select>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Theme"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Everyone</SelectItem>
                                        <SelectItem value="dark">Followers</SelectItem>
                                        <SelectItem value="system">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button>Save</Button>
                    </section>
                    <section className="space-y-4 hidden" id="notifications">
                        <h2 className="text-2xl font-semibold">Notifications</h2>
                        <div className="grid gap-4">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h3 className="font-semibold">Email</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly updates</p>
                                </div>
                                <Switch/>
                            </div>
                        </div>
                        <Button>Save</Button>
                    </section>
                    <section className="space-y-4 hidden" id="appearance">
                        <h2 className="text-2xl font-semibold">Appearance</h2>
                        <div className="grid gap-4">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h3 className="font-semibold">Dark Mode</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Enable dark mode</p>
                                </div>
                                <Switch defaultChecked/>
                            </div>
                        </div>
                        <Button>Save</Button>
                    </section>
                </div>
            </div>
        </div>
    )
}
