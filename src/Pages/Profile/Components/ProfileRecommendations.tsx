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

type ProfileRecommendationsContextProps = {
    pageGlobalUserID: string;
    isOwnPage: boolean;
    formattedRecs: FormattedProfileRecommendations;
    setFormattedRecs: React.Dispatch<React.SetStateAction<FormattedProfileRecommendations>>;
    handleDelete: (e: FormattedRecommendation<any>) => void;
    handleEdit: (e: FormattedRecommendation<any>) => void;

}

export const ProfileRecommendationsContext = React.createContext<ProfileRecommendationsContextProps>({
    pageGlobalUserID: '',
    isOwnPage: false,
    formattedRecs: {artists: [], albums: [], tracks: []},
    setFormattedRecs: (() => {
    }) as React.Dispatch<React.SetStateAction<FormattedProfileRecommendations>>,
    handleDelete: (e: FormattedRecommendation<any>) => {
    },
    handleEdit: (e: FormattedRecommendation<any>) => {
    }
});

const ProfileRecommendationsContextProvider = ({children, ...props}: {
    children: React.ReactNode,
    pageGlobalUserID: string,
    isOwnPage: boolean
}) => {
    const {pageGlobalUserID} = props;
    const [formattedRecs, setFormattedRecs] = useState<FormattedProfileRecommendations>({
        artists: [],
        albums: [],
        tracks: []
    })

    useEffect(() => {
        retrieveProfileRecommendations(props.pageGlobalUserID).then(res => setFormattedRecs(res));
    }, [])

    const handleDelete = (e: FormattedRecommendation<any>) => {
        console.log(e);
        deleteRecommendation(e.id).then(() => {
            createEvent(51, pageGlobalUserID, {id: e.item.id, type: e.item.type});
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setFormattedRecs(res));
        });
    }

    const handleEdit = (e) => {
    }

    const value = {
        formattedRecs,
        setFormattedRecs,
        handleDelete,
        handleEdit,
        ...props
    }

    return (
        <ProfileRecommendationsContext.Provider value={value}>
            {children}
        </ProfileRecommendationsContext.Provider>
    )
}

export const ProfileRecommendations = (props: { pageGlobalUserID: string, isOwnPage: boolean }) => {
    return (
        <ProfileRecommendationsContextProvider {...props}>
            <ProfileRecommendationsContent/>
        </ProfileRecommendationsContextProvider>
    )
}

const ProfileRecommendationsContent = () => {
    const {pageGlobalUserID, isOwnPage, formattedRecs, setFormattedRecs} = useContext(ProfileRecommendationsContext);
    const types = ['artist', 'album', 'track']

    return (
        <div>
            {isOwnPage && (
                <RecommendationSelectionModal/>
            )}
            <div>
                {types.map(t => {
                    return (
                        <RecommendationTypeShowcase type={t}/>
                    )
                })}
            </div>
        </div>
    )
}

const RecommendationTypeShowcase = (props: { type: string }) => {
    const {type} = props;
    const {formattedRecs, isOwnPage, pageGlobalUserID} = useContext(ProfileRecommendationsContext);
    const recs = formattedRecs[`${type}s`];
    return (
        recs.length > 0 && (
            <div className={"max-w-screen-md"}>
                <h3 className={"text-xl font-bold capitalize"}>{type}</h3>
                <div className={"inline-flex flex-col gap-4 w-full"}>
                    {recs.map(r => <Recommendation rec={r}/>)}
                </div>
            </div>
        )
    )
}

const Recommendation = (props: {
    rec: FormattedRecommendation<Album | Track | Artist>;
}) => {
    const {isOwnPage, handleDelete, handleEdit} = useContext(ProfileRecommendationsContext);
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
        <div key={rec.item.id} className={"relative inline-flex gap-4 p-4 border-2 w-full justify-left"}>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(rec)} className={"bg-destructive text-background"}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            </div>
        </div>
    )
}

const RecommendationSelectionModal = () => {
    const {pageGlobalUserID} = useContext(ProfileRecommendationsContext);
    const [selectedType, setSelectedType] = useState<"artist" | "track" | "album">('album');
    const [selectedItem, setSelectedItem] = useState<Album | Track | Artist>(null);
    const [searchInput, setSearchInput] = useState('');
    const descriptionRef = React.createRef<HTMLTextAreaElement>();
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (searchInput) {
            debouncedSearchResults(searchInput, selectedType).then(res => setSelectedItem(res[0]));
        }
    }, [searchInput]);


    const dialogProps = [
        {
            text: "New",
            title: "New recommendation",
            description: "Make a new profile recommendation.",
            submissionCondition: !!selectedItem,
        },
        {
            text: "New",
            title: "New recommendation",
            description: 'Write your profile recommendation.',
            actionDescription: 'Submit',
            action: () => {
                if (selectedItem && descriptionRef.current.value.length > 0) {
                    setProcessing(true);
                    submitRecommendation(pageGlobalUserID, selectedItem, selectedType, descriptionRef.current.value).then(() => {
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
                    <Button variant={selectedType === 'album' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('album')}>Album</Button>
                    <Button variant={selectedType === 'artist' ? 'default' : 'outline'}
                            onClick={() => setSelectedType('artist')}>Artist</Button>
                    <Button variant={selectedType === 'track' ? 'default' : 'outline'}
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