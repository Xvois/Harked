import {Review} from "@/Tools/Interfaces/reviewInterfaces";
import React, {useState} from "react";
import {submitReview} from "@/Tools/reviews";
import {SelectionModal} from "@/Components/SelectionModal";
import {Track} from "@/API/Interfaces/trackInterfaces";
import {Artist} from "@/API/Interfaces/artistInterfaces";
import {Album} from "@/API/Interfaces/albumInterfaces";

const CreateRecommendationForm = (props: { user_id: string, reviews: Review[], updatePage: Function }) => {
    const {user_id, reviews, updatePage} = props;

    const [showModal, setShowModal] = useState(false);

    const handleSubmit = async (selectedItem: Track | Artist | Album, description: string, rating: number) => {
        await submitReview(structuredClone(selectedItem), rating, description)
            .catch((e) => {
                console.error(e);
            });
        updatePage();
    }

    return (
        <div>
            <button className={'subtle-button'} onClick={() => setShowModal(true)}>Add review</button>
            <SelectionModal
                showModal={showModal}
                setShowModal={setShowModal}
                onSubmit={handleSubmit}
                description
                rating
            />
        </div>
    )
}

export default CreateRecommendationForm;