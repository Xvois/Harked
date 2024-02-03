import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getLIDescription, getLIName} from "@/Analysis/analysis";
import "./CSS/Review.css"
import {retrieveReview} from "@/Tools/reviews";
import {isLoggedIn, retrieveLoggedUserID} from "@/Tools/users";
import {StyledRating} from "@/Components/styles";
import {CommentSection} from "@/Components/CommentSection";


const Review = () => {
    const id = (useParams()).id
    const [review, setReview] = useState(undefined);
    const [possessive, setPossessive] = useState(undefined);

    useEffect(() => {
        console.log(id);
        retrieveReview(id).then((r) => {
            setReview(r);
            if (isLoggedIn()) {
                retrieveLoggedUserID().then((user_id) => {
                    if (user_id === r.owner) {
                        setPossessive('your');
                    } else {
                        setPossessive(`${r.owner}'s`);
                    }
                })
            } else {
                setPossessive(`${r.owner}'s`);
            }
        });
    }, [])

    return (
        review && possessive &&
        <>
            <div className={'full-review-wrapper'}>
                <div className={'review-wrapper'}
                     style={{float: 'left', flexShrink: 0, flexGrow: 0, height: 'max-content'}}>
                    <div>
                        <img className={'backdrop-image'} alt={getLIName(review.item)} src={review.item.image}/>
                        <img className={'levitating-image'} alt={getLIName(review.item)} src={review.item.image}/>
                    </div>
                    <div>
                        <p style={{
                            margin: 0,
                            color: 'var(--secondary-colour)'
                        }}>[NEEDS TYPE]</p>
                        <a className={'heavy-link'} href={review.item.link}
                           style={{margin: 0}}>{getLIName(review.item)}</a>
                        <p style={{margin: 0}}>{getLIDescription(review.item)}</p>
                        <StyledRating
                            readOnly
                            value={review.rating}
                            precision={0.5}
                        />
                    </div>
                </div>
                <div className={'review-description'}>
                    <p style={{margin: 0}}>Review by</p>
                    <a className={'heavy-link'} style={{fontSize: '30px'}}
                       href={`/profile/${review.owner.user_id}`}>{review.owner.username}</a>
                    {review.description &&
                        <p style={{whiteSpace: 'pre-line', marginBottom: 0}}>{review.description}</p>
                    }
                </div>
            </div>
            <div style={{marginTop: '25px'}}>
                <div className={'section-header'}>
                    <div style={{maxWidth: '400px'}}>
                        <p style={{
                            margin: '16px 0 0 0',
                            textTransform: 'uppercase'
                        }}>{possessive}</p>
                        <h3 style={{marginBottom: '15px', marginTop: '0', textTransform: 'uppercase'}}>Review
                            comments</h3>
                    </div>
                </div>
                <CommentSection sectionID={id} owner={review.owner} isAdmin={false}/>
            </div>
        </>
    )
}

export default Review;