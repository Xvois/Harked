import React, {SetStateAction, useEffect, useRef, useState} from "react";
import {getLIDescription, getLIName} from "@/Tools/analysis";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {retrieveSearchResults} from "@/Tools/search";
import {LoadingIndicator} from "@/Components/LoadingIndicator";
import {StyledField, StyledRating} from "@/Components/styles";
import {createPictureSources, getInputRefValue, isTrack} from "@/Tools/utils";
// TODO: REMAKE THIS
export const SelectionModal = (props: {
    showModal: boolean,
    setShowModal: React.Dispatch<SetStateAction<boolean>>,
    onSubmit: Function,
    onModify?: Function,
    modifyTarget?: Track | Artist | Album,
    description?: boolean,
    rating?: boolean
}) => {

    const {
        showModal,
        setShowModal,
        onSubmit,
        onModify = null,
        description = false,
        rating = false,
        modifyTarget = null
    } = props;
    const [searchResults, setSearchResults] = useState(null);
    const [selectedItem, setSelectedItem] = useState(modifyTarget);
    const [processing, setProcessing] = useState(false);
    const searchRef = useRef(null);
    const descriptionRef = useRef(null);
    const [stars, setStars] = useState(0);
    const typeChoices = ['track', 'artist', 'album'];
    const [type, setType] = useState(typeChoices[0]);
    const images = isTrack(selectedItem) ? selectedItem.album.images : selectedItem.images;
    const imageSrcSet = createPictureSources(images, 0.25);

    useEffect(() => {
        setSelectedItem(modifyTarget);
    }, [modifyTarget])

    useEffect(() => {
        const modal = document.getElementById('rec-modal') as HTMLDialogElement;
        if (showModal) {
            modal.showModal();
        } else if (!showModal) {
            modal.close();
        }
    }, [showModal])

    const handleSearch = () => {
        retrieveSearchResults(getInputRefValue(searchRef), type as 'track' | 'artist' | 'album').then(res => {
            setSearchResults(res);
        });
    }

    const successCleanup = () => {
        setSearchResults(null);
        setSelectedItem(null);
        setShowModal(false);
    }

    return (
        <dialog autoFocus id={'rec-modal'}>
            {selectedItem === null ?
                <div style={{justifyContent: 'right'}}>
                    <button className={'modal-exit-button'} onClick={() => {
                        successCleanup();
                    }}>x
                    </button>
                    <h3 style={{margin: 0}}>Type</h3>
                    <p style={{marginTop: 0}}>of item.</p>
                    <div id={'rec-type-wrapper'}>
                        {typeChoices.map(t => {
                            return <button type={'button'} onClick={() => setType(t)} key={t}
                                           className={'subtle-button'} style={type === t ? {
                                background: 'var(--primary-colour)',
                                color: 'var(--bg-colour)',
                                textTransform: 'capitalize'
                            } : {textTransform: 'capitalize'}}>{t}</button>
                        })}
                    </div>
                    <h3 style={{marginBottom: 0}}>Search</h3>
                    <p style={{marginTop: 0}}>for an item.</p>
                    <StyledField
                        fullWidth
                        placeholder={`Search for ${type}`}
                        variant='outlined'
                        rows={1}
                        inputRef={searchRef}
                        inputProps={{maxLength: 100}}
                    />
                    <div style={{width: "max-content", marginLeft: 'auto'}}>
                        <button className="std-button"
                                style={{
                                    background: 'rgba(125, 125, 125, 0.1)',
                                    borderColor: 'rgba(125, 125, 125, 0.2)',
                                    borderTop: "none"
                                }} type={"button"} onClick={handleSearch}>
                            Search
                        </button>
                    </div>
                    {searchResults && (
                        <div id={'rec-search-results'}>
                            {/* Render search results */}
                            {searchResults.slice(0, 5).map((result, index) => {
                                return (
                                    <div key={getLIName(result) + index} style={{position: 'relative'}}>
                                        {index % 2 === 0 && <div className={'bg-element'}/>}
                                        <button onClick={() => setSelectedItem(result)} className={'rec-search-result'}>
                                            <img alt={getLIName(result)} src={result.image}
                                                 className={'levitating-image'}/>
                                            <h4>{getLIName(result, 20)}</h4>
                                            <p>{getLIDescription(result, 20)}</p>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div>
                :
                <div>
                    {processing && (
                        <div className={'processing-indicator-wrapper'}>
                            <LoadingIndicator/>
                        </div>
                    )
                    }
                    <button className={'modal-exit-button'} onClick={() => {
                        setShowModal(false);
                        setSearchResults(null)
                    }}>x
                    </button>
                    <form>
                        <div style={{position: 'relative'}} className={'rec-details-img'}>
                            <img alt={'backdrop-image'} srcSet={imageSrcSet} className={'backdrop-image'}/>
                            <img alt={getLIName(selectedItem)} srcSet={imageSrcSet} className={'levitating-image'}/>
                        </div>
                        <div style={{maxWidth: '300px'}}>
                            <h2 style={{marginBottom: 0}}>{getLIName(selectedItem)}</h2>
                            <p style={{marginTop: 0}}>{getLIDescription(selectedItem)}</p>
                            {rating &&
                                <div style={{marginBottom: '16px'}}>
                                    <StyledRating
                                        name="text-feedback"
                                        value={stars}
                                        onChange={(event, newValue) => {
                                            console.log(newValue);
                                            setStars(newValue);
                                        }}
                                        precision={0.5}
                                    />
                                </div>
                            }
                            {description &&
                                <StyledField
                                    fullWidth
                                    variant='outlined'
                                    multiline
                                    rows={3}
                                    inputRef={descriptionRef}
                                />
                            }
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: '16px'
                            }}>
                                {modifyTarget === null && (
                                    <button className={'subtle-button'} type={'button'}
                                            onClick={() => setSelectedItem(null)}>Back</button>
                                )}
                                <button className={'subtle-button'} type={"button"} style={{marginLeft: 'auto'}}
                                        onClick={() => {
                                            if (!!modifyTarget) {
                                                setProcessing(true);
                                                onModify(selectedItem, type, descriptionRef.current.value, stars).then(
                                                    () => {
                                                        setProcessing(false);
                                                        successCleanup();
                                                    });
                                            } else {
                                                setProcessing(true);
                                                onSubmit(selectedItem, type, descriptionRef.current.value, stars).then(
                                                    () => {
                                                        setProcessing(false);
                                                        successCleanup();
                                                    });
                                            }
                                        }}>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            }
        </dialog>
    )
}