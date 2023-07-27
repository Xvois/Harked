import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {isLoggedIn, retrieveLoggedUserID, retrieveReview} from "./HDM.ts";
import {capitalize} from "@mui/material";
import {CommentSection, StyledRating} from "./SharedComponents.tsx";
import {getItemType, getLIDescription, getLIName} from "./Analysis";


const Review = () => {
    const id = (useParams()).id
    const [review, setReview] = useState(undefined);
    const [possessive, setPossessive] = useState(undefined);
    const type = review ? getItemType(review.item) : undefined;

    useEffect(() => {
        console.log(id);
        retrieveReview(id).then((r) => {
            setReview(r);
            if (isLoggedIn()) {
                retrieveLoggedUserID().then((user_id) => {
                    if (user_id === r.owner.user_id) {
                        setPossessive('your');
                    } else {
                        setPossessive(`${r.owner.username}'s`);
                    }
                })
            } else {
                setPossessive(`${r.owner.username}'s`);
            }
        });
    }, [])

    return (
        review && possessive &&
        <>
            <p style={{margin: 0}}>Review by</p>
            <a className={'heavy-link'} style={{fontSize: '30px'}}
               href={`/profile/${review.owner.user_id}`}>{review.owner.username}</a>
            <div className={'review'}>
                <img style={{width: '100%', height: '100px', top: 0}} className={'backdrop-image'}
                     alt={getLIName(review.item)} src={review.item.image}/>
                <div className={'review-heading'}>
                    <div>
                        <p style={{
                            margin: 0,
                            color: 'var(--secondary-colour)'
                        }}>{capitalize(type.slice(0, type.length - 1))}</p>
                        <a className={'heavy-link'} href={review.item.link}
                           style={{margin: 0}}>{getLIName(review.item)}</a>
                        <p style={{margin: 0}}>{getLIDescription(review.item)}</p>
                        <StyledRating
                            readOnly
                            value={review.rating}
                            precision={0.5}
                        />
                        {review.description &&
                            <p style={{whiteSpace: 'pre-line', marginBottom: 0}}>{review.description}</p>
                        }
                    </div>
                </div>
            </div>
            <div style={{marginTop: '25px'}}>
                <div className={'section-header'}>
                    <div style={{maxWidth: '400px'}}>
                        <p style={{
                            margin: '16px 0 0 0',
                            textTransform: 'uppercase'
                        }}>{possessive}</p>
                        <h3 style={{margin: '0', textTransform: 'uppercase'}}>Review comments</h3>
                        <p>Have anything to add to {possessive} review of {getLIName(review.item)}?</p>
                    </div>
                </div>
                <CommentSection sectionID={id} owner={review.owner} isAdmin={false}/>
            </div>
        </>
    )
}

export default Review;