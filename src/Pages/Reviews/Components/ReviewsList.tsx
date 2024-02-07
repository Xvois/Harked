import {ReviewWithItem} from "@/Tools/Interfaces/reviewInterfaces";
import {getLIName} from "@/Analysis/analysis";
import {deleteReview} from "@/Tools/reviews";
import React from "react";
import ReviewItem from "@/Pages/Reviews/Components/ReviewItem";

const ReviewsList = (props: {
    reviews: Array<ReviewWithItem<any>>,
    isOwnPage: boolean,
    includedTypes: Array<string>,
    updatePage: Function
}) => {
    const {reviews, isOwnPage, includedTypes, updatePage} = props;

    const handleDelete = (e) => {
        if (window.confirm(`Are you sure you want to delete your review of ${getLIName(e.item)}?`)) {
            deleteReview(e.id).then(() => updatePage());
        }
    }

    return (
        <div className={'review-list'}>
            <p>TYPE FILTERING DOES NOT WORK</p>
            {reviews !== undefined ?
                reviews.map((r) => {
                    return <ReviewItem key={r.id} review={r} isOwnPage={isOwnPage} handleDelete={handleDelete}/>
                })
                :
                <>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                    <div className={'placeholder'} style={{width: '332px', height: '516px'}}/>
                </>
            }
        </div>
    )
}

export default ReviewsList;