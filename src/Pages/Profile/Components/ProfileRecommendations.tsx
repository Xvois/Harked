import React, {useEffect, useState} from "react";
import {
    deleteRecommendation,
    modifyRecommendation,
    retrieveProfileRecommendations,
    submitRecommendation
} from "@/Tools/recommendations";
import {createEvent} from "@/Tools/events";
import {getLIDescription, getLIName} from "@/Tools/analysis";
import {SpotifyLink} from "@/Components/SpotifyLink";
import {SelectionModal} from "@/Components/SelectionModal";
import {FormattedProfileRecommendations, FormattedRecommendation} from "@/Tools/Interfaces/recommendationInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {createPictureSources, isAlbum, isArtist, isTrack} from "@/Tools/utils";
import {ItemType} from "@/Tools/Interfaces/databaseInterfaces";

const ProfileRecommendations = (props: { pageGlobalUserID: string; isOwnPage: boolean; }) => {
    const {pageGlobalUserID, isOwnPage} = props;

    const [formattedRecs, setFormattedRecs] = useState<FormattedProfileRecommendations>(null);
    const artistRecs = formattedRecs.artists;
    const albumRecs = formattedRecs.albums;
    const trackRecs = formattedRecs.tracks;

    const [showSelection, setShowSelection] = useState(false);
    const [initialItem, setInitialItem] = useState(null);


    useEffect(() => {
        retrieveProfileRecommendations(pageGlobalUserID).then(res => setFormattedRecs(res));
    }, [])

    const handleDelete = (e) => {
        console.log(e);
        deleteRecommendation(e.id).then(() => {
            createEvent(51, pageGlobalUserID, e.item);
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setFormattedRecs(res));
        });
    }

    const handleEdit = (e) => {
        setInitialItem(e.item);
        setShowSelection(true);
    }
    // TODO: FINISH RECS
    return (
        <div style={{width: '100%', position: 'relative'}}>
            {isOwnPage && (
                <button className={'subtle-button'}
                        onClick={() => {
                            setShowSelection(true);
                            setInitialItem(null);
                        }}>
                    New
                </button>
            )}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '15px',
                flexWrap: 'wrap',
                margin: '16px 0',
            }}>
                <p>RECS UNDER WORKS</p>
            </div>
            <RecommendationSelectionModal initialItem={initialItem} showModal={showSelection}
                                          setShowModal={setShowSelection}
                                          recommendations={formattedRecs} setRecommendations={setFormattedRecs}
                                          pageGlobalUserID={pageGlobalUserID}/>
        </div>
    )
}

const Recommendation = (props: { rec: FormattedRecommendation<Album | Track | Artist>; isOwnPage: boolean; handleDelete: (e: FormattedRecommendation<any>) => void; handleEdit: (e: FormattedRecommendation<any>) => void; }) => {
    const {rec, isOwnPage, handleDelete, handleEdit} = props;
    let images;
    if (isTrack(rec.item)) {
        images = rec.item.album.images;
    } else {
        images = rec.item.images;
    }
    const imageSrcSet = createPictureSources(images, 0.5);
    return (
        <div key={rec.item.id} style={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: '1',
            gap: '15px',
            background: 'rgba(125, 125, 125, 0.1)',
            border: '1px solid rgba(125, 125, 125, 0.75)',
            padding: '15px',
            width: 'max-content',
            overflow: 'hidden',
            wordBreak: 'break-word'
        }}>
            <div className={'supplemental-content'} style={{position: 'relative', height: '150px', width: '150px'}}>
                <img alt={`${getLIName(rec.item)}`} srcSet={imageSrcSet} className={'backdrop-image'}
                     style={{aspectRatio: '1', width: '125%', objectFit: 'cover'}}/>
                <img alt={`${getLIName(rec.item)}`} srcSet={imageSrcSet} className={'levitating-image'}
                     style={{aspectRatio: '1', width: '100%', objectFit: 'cover'}}/>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', flexGrow: '1', minWidth: '200px'}}>
                <h2 style={{margin: '0'}}>
                    {getLIName(rec.item)}
                    <span style={{margin: '5px 0 0 10px'}}>
                                            <SpotifyLink simple link={rec.item.uri}/>
                                        </span>
                </h2>
                <p style={{margin: '0'}}>{getLIDescription(rec.item)}</p>
                {rec.description.length > 0 && (
                    <p style={{marginBottom: 0}}>
                        <em>
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                            {rec.description}
                            <span style={{color: 'var(--accent-colour)', margin: '0 2px'}}>"</span>
                        </em>
                    </p>
                )}
                {isOwnPage && (
                    <div style={{display: 'flex', margin: 'auto 0 0 auto', gap: '15px'}}>
                        <button className={'subtle-button'} onClick={() => handleEdit(rec)}>Edit</button>
                        <button className={'subtle-button'}
                                onClick={() => handleDelete(rec)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
type RecommendationSelectionModalProps = {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  recommendations: FormattedProfileRecommendations;
  setRecommendations: (recs: FormattedProfileRecommendations) => void;
  pageGlobalUserID: string;
  initialItem?: Track | Album | Artist; //
};
const RecommendationSelectionModal = (props: RecommendationSelectionModalProps) => {
    const {showModal, setShowModal, recommendations, setRecommendations, pageGlobalUserID, initialItem = null} = props;

    const handleSubmit = async (selectedItem: Track | Album | Artist, type: ItemType, description: string) => {

        await submitRecommendation(pageGlobalUserID, selectedItem, type, description).then(() => {
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecommendations(res));
        });
    }

    const handleModify = async (selectedItem: Track | Album | Artist, type: ItemType, description: string) => {
        let existingRecIndex = -1;
        if (isTrack(selectedItem)) {
            existingRecIndex = recommendations.tracks.findIndex(r => r.item.id === selectedItem.id);
        } else if (isAlbum(selectedItem)) {
            existingRecIndex = recommendations.albums.findIndex(r => r.item.id === selectedItem.id);
        } else if (isArtist(selectedItem)) {
            existingRecIndex = recommendations.artists.findIndex(r => r.item.id === selectedItem.id);
        } else {
            throw new Error('Invalid item type in handleModify recommendation.');
        }
        const existingRec = recommendations[existingRecIndex];
        await modifyRecommendation(pageGlobalUserID, existingRec, type, description).then(() => {
            retrieveProfileRecommendations(pageGlobalUserID).then(res => setRecommendations(res));
        })
    }

    return (
        <SelectionModal
            showModal={showModal}
            setShowModal={setShowModal}
            onModify={handleModify}
            onSubmit={handleSubmit}
            modifyTarget={initialItem}
            description
        />
    )
}