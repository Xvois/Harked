import React from 'react';
import { ReviewsProvider } from './ReviewsContext';
import ReviewsContent from './ReviewsContent';

const Reviews = () => {
    return (
        <ReviewsProvider>
            <ReviewsContent />
        </ReviewsProvider>
    );
};

export default Reviews;