import React, {useContext, useEffect, useState} from "react";
import {deleteRecommendation, retrieveProfileRecommendations, submitRecommendation} from "@/Tools/recommendations";
import {createEvent} from "@/Tools/events";
import {getLIDescription, getLIName} from "@/Analysis/analysis";
import {FormattedProfileRecommendations, FormattedRecommendation} from "@/Tools/Interfaces/recommendationInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {createPictureSources, getImgSrcSet, isTrack} from "@/Tools/utils";
import {Separator} from "@/Components/ui/separator";
import {Button} from "@/Components/ui/button";
import {Input} from "@/Components/ui/input";
import {MultistageDialog} from "@/Components/MultistageDialog";
import {debouncedSearchResults} from "@/Tools/search";
import {Textarea} from "@/Components/ui/textarea";
import {useMediaQuery} from "react-responsive";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/Components/ui/dropdown-menu";
import {ProfileContext} from "@/Pages/Profile/ProfileContext";
import {Skeleton} from "@/Components/ui/skeleton";

type ProfileRecommendationsContextProps = {
    formattedRecs: FormattedProfileRecommendations;
    setFormattedRecs: React.Dispatch<React.SetStateAction<FormattedProfileRecommendations>>;
    handleDelete: (e: FormattedRecommendation<any>) => void;
    handleEdit: (e: FormattedRecommendation<any>) => void;

}

export const ProfileRecommendationsContext = React.createContext<ProfileRecommendationsContextProps>({
    formattedRecs: {artists: [], albums: [], tracks: []},
    setFormattedRecs: (() => {
    }) as React.Dispatch<React.SetStateAction<FormattedProfileRecommendations>>,
    handleDelete: (e: FormattedRecommendation<any>) => {
    },
    handleEdit: (e: FormattedRecommendation<any>) => {
    }
});

const ProfileRecommendationsContextProvider = ({children}: {
    children: React.ReactNode,
}) => {
    const {pageUser} = useContext(ProfileContext);
    const [formattedRecs, setFormattedRecs] = useState<FormattedProfileRecommendations>({
        artists: [],
        albums: [],
        tracks: []
    })

    useEffect(() => {
        if (pageUser) {
            retrieveProfileRecommendations(pageUser.id).then(res => setFormattedRecs(res));
        }
    }, [pageUser])

    const handleDelete = (e: FormattedRecommendation<any>) => {
        console.log(e);
        deleteRecommendation(e.id).then(() => {
            createEvent(51, pageUser.id, {id: e.item.id, type: e.item.type});
            retrieveProfileRecommendations(pageUser.id).then(res => setFormattedRecs(res));
        });
    }

    const handleEdit = (e) => {
    }

    const value = {
        formattedRecs,
        setFormattedRecs,
        handleDelete,
        handleEdit,
    }

    return (
        <ProfileRecommendationsContext.Provider value={value}>
            {children}
        </ProfileRecommendationsContext.Provider>
    )
}

export const ProfileRecommendations = () => {
    return (
        <ProfileRecommendationsContextProvider>
            <ProfileRecommendationsContent/>
        </ProfileRecommendationsContextProvider>
    )
}

const ProfileRecommendationsContent = () => {
    const types = ['artist', 'track', 'album'];

    return (
        <div className={"flex flex-row gap-4 flex-wrap-reverse"}>
            {types.map(t => {
                return (
                    <RecommendationTypeShowcase key={`rec_${t}`} type={t}/>
                )
            })}
        </div>
    )
}


const RecommendationTypeShowcase = (props: { type: string }) => {
    const {type} = props;
    const {isOwnPage, pageUser} = useContext(ProfileContext);
    const {formattedRecs} = useContext(ProfileRecommendationsContext);
    const recs = formattedRecs[`${type}s`];
    const emptyDivs = Array(3 - recs.length).fill(null).map((_, i) =>
        <RecommendationSelectionModal fixedType={type as "artist" | "track" | "album"} key={`empty_rec_${type}_${i}`}/>
    );
    return (
        <div className={"flex flex-col gap-4 w-96 flex-grow"}>
            {pageUser && recs ?
                <React.Fragment>
                    {recs.map(r => <Recommendation key={r.id} rec={r}/>)}
                    {isOwnPage && emptyDivs}
                </React.Fragment>
                :
                <React.Fragment>
                    <SkeletonRecommendation/>
                    <SkeletonRecommendation/>
                    <SkeletonRecommendation/>
                </React.Fragment>
            }
        </div>


    )
}

const SkeletonRecommendation = () => {
    return (
        <div className={"relative inline-flex gap-4 p-4 border-2 w-full justify-left"}>
            <Skeleton className={"h-32 w-32"}></Skeleton>
            <div className={'inline-flex flex-col flex-grow gap-2'}>
                <Skeleton className={"h-5 w-16"}></Skeleton>
                <Separator/>
                <Skeleton className={"h-4 w-32"}></Skeleton>
            </div>
        </div>
    )

}

const EmptyRecommendation = () => {
    return (
        <div className={"relative inline-flex gap-4 p-4 border-2 border-dashed w-full justify-left"}>
            <div className={"centre"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
                    <line x1="25" y1="10" x2="25" y2="40" stroke="white" stroke-width="2"/>
                    <line x1="10" y1="25" x2="40" y2="25" stroke="white" stroke-width="2"/>
                </svg>
            </div>

            <div className={"h-32 w-32 bg-secondary"}>
            </div>
            <div className={'inline-flex flex-col flex-grow gap-2'}>
                <div className={"h-5 w-16 bg-secondary"}></div>
                <Separator/>
                <div className={"h-4 w-32 bg-secondary"}></div>
            </div>
        </div>
    )
}

const Recommendation = (props: {
    rec: FormattedRecommendation<Album | Track | Artist>;
}) => {
    const {isOwnPage} = useContext(ProfileContext);
    const {handleDelete, handleEdit} = useContext(ProfileRecommendationsContext);
    const {rec} = props;
    const isNotSmallScreen = useMediaQuery({minWidth: 640}); // Tailwind's sm breakpoint is 640px
    let images;
    if (isTrack(rec.item)) {
        images = rec.item.album.images;
    } else {
        images = rec.item.images;
    }
    const imageSrcSet = createPictureSources(images, 0.5);
    return (
        <div key={rec.item.id} className={"relative inline-flex gap-4 p-4 border-2 justify-left"}>
            <div>
                <img srcSet={imageSrcSet} alt={getLIName(rec.item)} className={"h-32 w-32"}/>
            </div>
            <div className={'flex-grow'}>
                <h2 className={"font-bold"}>{getLIName(rec.item)}</h2>
                <Separator/>
                <p>{getLIDescription(rec.item)}</p>
                {rec.description.length > 0 && (
                    <p>
                        <em>
                            <span>"</span>
                            {rec.description}
                            <span>"</span>
                        </em>
                    </p>
                )}
            </div>
            <div className={'absolute bottom-4 right-4 inline-flex gap-4'}>
                {isNotSmallScreen ? (
                        <React.Fragment>
                            <Button variant={'outline'} asChild>
                                <a href={rec.item.uri}>Listen</a>
                            </Button>
                            {isOwnPage && (
                                <React.Fragment>
                                    <Button onClick={() => handleEdit(rec)}>Edit
                                    </Button>
                                    <Button onClick={() => handleDelete(rec)} variant={'destructive'}>
                                        Delete
                                    </Button>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )
                    :
                    <DropdownMenu>
                        <DropdownMenuTrigger><Button variant={'outline'}>More</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <a href={rec.item.uri}>Listen</a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleEdit(rec)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onClick={() => handleDelete(rec)}
                                              className={"bg-destructive text-background"}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            </div>
        </div>
    )
}

const RecommendationSelectionModal = (props: { fixedType?: "artist" | "track" | "album" | null }) => {
    const {fixedType} = props;
    const {pageUser} = useContext(ProfileContext);
    const [selectedType, setSelectedType] = useState<"artist" | "track" | "album">(fixedType ? fixedType : 'album');
    const [selectedItem, setSelectedItem] = useState<Album | Track | Artist>(null);
    const [searchInput, setSearchInput] = useState('');
    const descriptionRef = React.createRef<HTMLTextAreaElement>();
    const [processing, setProcessing] = useState(false);

    const ButtonTrigger = <Button
        className={"bg-background w-full h-full p-0 hover:bg-background"}><EmptyRecommendation/></Button>

    useEffect(() => {
        if (searchInput) {
            debouncedSearchResults(searchInput, selectedType).then(res => setSelectedItem(res[0]));
        }
    }, [searchInput]);


    const dialogProps = [
        {
            trigger: ButtonTrigger,
            title: "New recommendation",
            description: "Make a new profile recommendation.",
            submissionCondition: !!selectedItem,
        },
        {
            trigger: ButtonTrigger,
            title: "New recommendation",
            description: 'Write your profile recommendation.',
            actionDescription: 'Submit',
            action: () => {
                if (selectedItem && descriptionRef.current.value.length >= 0) {
                    setProcessing(true);
                    submitRecommendation(pageUser.id, selectedItem, selectedType, descriptionRef.current.value).then(() => {
                        setProcessing(false);
                    })
                }
            },
            submissionCondition: !processing
        },
    ]
    return (
        <MultistageDialog dialogProps={dialogProps}>
            <div className={"flex flex-col gap-4"}>
                <div>
                    <h3>Item type</h3>
                    <p className={"text-muted-foreground"}>Select the type of item you would like to
                        recommend.</p>
                </div>
                <Separator/>
                <div className={'inline-flex w-full gap-4'}>
                    <Button disabled={fixedType && selectedType != 'album'}
                            variant={selectedType === 'album' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('album')}>Album</Button>
                    <Button disabled={fixedType && selectedType != 'artist'}
                            variant={selectedType === 'artist' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('artist')}>Artist</Button>
                    <Button disabled={fixedType && selectedType != 'track'}
                            variant={selectedType === 'track' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('track')}>Track</Button>
                </div>
                <div>
                    <h3><span className={"capitalize"}>{selectedType}</span> name</h3>
                    <p className={"text-muted-foreground"}>Type in the name of the item you would like to recommend.</p>
                </div>
                <Separator/>
                <div className={'inline-flex w-full gap-4'}>
                    <Input placeholder={`Name of ${selectedType}`} onChange={(e) => setSearchInput(e.target.value)}/>
                </div>
            </div>

            {selectedItem && (
                <div className={"inline-flex gap-4 flex-col"}>
                    <div className={"flex flex-col sm:flex-row w-full gap-4"}>
                        <img srcSet={getImgSrcSet(selectedItem, 0.25)} alt={selectedItem?.name}
                             className={"w-0 sm:w-32"}/>
                        <div className={"flex-grow"}>
                            <h4 className={"text-xl font-bold"}>{getLIName(selectedItem)}</h4>
                            <Separator/>
                            <p className={"text-muted-foreground text-sm"}>by {getLIDescription(selectedItem)}</p>
                            <Textarea placeholder={"You can leave this empty"} ref={descriptionRef}/>
                        </div>
                    </div>
                    <p className={"absolute left-6 bottom-6 text-muted-foreground text-sm underline"}>Not right?</p>
                </div>
            )}

        </MultistageDialog>
    )
}