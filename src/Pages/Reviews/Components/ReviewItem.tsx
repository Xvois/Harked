import {ReviewWithItem} from "@/Tools/Interfaces/reviewInterfaces";
import NotesSharpIcon from "@mui/icons-material/NotesSharp";
import {getLIDescription, getLIName} from "@/Analysis/analysis";
import {StyledRating} from "@/Components/styles";
import React from "react";
import {Album} from "@/API/Interfaces/albumInterfaces";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {createPictureSources, isTrack} from "@/Tools/utils";

const ReviewItem = (props: { review: ReviewWithItem<Artist | Track | Album>, isOwnPage: boolean, handleDelete: Function }) => {
    const {review, isOwnPage, handleDelete} = props;

    const created = new Date(review.created);
    const edited = new Date(review.updated)

    const images = isTrack(review.item) ? review.item.album.images : review.item.images;
    const imageSrcSrt = createPictureSources(images, 0.25);


    return (
        <div className={'review-wrapper'} style={{position: 'relative', width: 'max-content'}}>
            {review.id &&
                <a style={{position: 'absolute', width: '100%', height: '450px', top: 0, left: 0, zIndex: 1}}
                   href={`/review/${review.id}`}/>
            }
            <div className={'review-heading'}>
                {review.description &&
                    <div style={{position: 'absolute', top: 15, right: 15}}>
                        <NotesSharpIcon fontSize={'small'}/>
                    </div>
                }
                <p style={{
                    margin: 0,
                    color: 'var(--secondary-colour)'
                }}>[NEEDS TYPE]</p>
                <a className={'heavy-link'} href={review.item.href} style={{margin: 0}}>{getLIName(review.item)}</a>
                <p style={{margin: 0}}>{getLIDescription(review.item)}</p>
                <StyledRating
                    readOnly
                    value={review.rating}
                    precision={0.5}
                />
            </div>
            <div style={{position: 'relative'}}>
                <img loading={"lazy"} className={'backdrop-image'}
                     style={{
                         filter: 'blur(100px) brightness(100%)',
                         width: '300px',
                         height: '300px',
                         objectFit: 'cover'
                     }}
                     alt={getLIName(review.item)} src={review.item.href}/>
                <img loading={"lazy"} className={'levitating-image'}
                     style={{width: '300px', height: '300px', objectFit: 'cover'}} alt={getLIName(review.item)}
                     srcSet={imageSrcSrt}/>
            </div>
            <div style={{display: "flex", justifyContent: 'space-between', alignItems: 'end', width: '100%'}}>
                <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                    {created.getTime() !== edited.getTime() ?
                        <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Edited last
                            on <br/> {edited.toDateString()}</p>
                        :
                        <p style={{margin: 0, color: 'var(--secondary-colour)', fontSize: '14px'}}>Reviewed
                            on <br/> {created.toDateString()}</p>
                    }
                </div>
                {isOwnPage && review.id &&
                    <button className={'subtle-button'} onClick={() => handleDelete(review)}>Delete</button>
                }
            </div>
        </div>
    )
}

export default ReviewItem;