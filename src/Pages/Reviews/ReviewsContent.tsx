import React, {useContext} from 'react';
import UserDetails from "@/Pages/Reviews/Components/UserDetails";
import ReviewsList from "@/Pages/Reviews/Components/ReviewsList";
import {ReviewsContext} from "@/Pages/Reviews/ReviewsContext";
import CreateRecommendationForm from "@/Pages/Reviews/Components/CreateRecommendationForm";
import InputForm from "@/Pages/Reviews/Components/InputForm";

const ReviewsContent = () => {
    const {pageUser, possessive, reviewsPage, isOwnPage, includedTypes, updatePage, isLoaded} = useContext(ReviewsContext);

    return (
        <div>
            {isLoaded &&
                <React.Fragment>
                    <UserDetails user={pageUser} possessive={possessive} numOfReviews={reviewsPage.items.length}
                                 isOwnPage={isOwnPage}/>
                    <CreateRecommendationForm user_id={pageUser?.id} reviews={reviewsPage.items}
                                              updatePage={updatePage}/>
                    <ReviewsList reviews={reviewsPage.items} isOwnPage={isOwnPage} includedTypes={includedTypes}
                                 updatePage={updatePage}/>
                </React.Fragment>
            }

        </div>
    );
};

export default ReviewsContent;