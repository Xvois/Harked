import {User} from "@/Tools/Interfaces/userInterfaces";
import {createPictureSources} from "@/Tools/utils";
import React from "react";

const UserDetails = (props: { user: User, possessive: string, numOfReviews: number, isOwnPage: boolean }) => {
    const {user, possessive, numOfReviews, isOwnPage} = props;
    const pictures = user.images;
    const imageSrcSet = createPictureSources(pictures, 0.1);
    return (
        <div className='user-container' style={{marginBottom: '25px', width: 'max-content', maxWidth: '100%'}}>
            <div style={{display: 'flex', flexDirection: 'row', maxHeight: '150px', gap: '15px'}}>
                <div className={'profile-picture'}>
                    <img alt={'profile picture'} className={'levitating-image'} srcSet={imageSrcSet}
                         style={{height: '100%', width: '100%', objectFit: 'cover'}}/>
                </div>
                <div className={'user-details'}>
                    <p style={{margin: '0 0 -5px 0'}}>Reviews from</p>
                    <a className={'heavy-link'} href={`/profile/${user.id}`}
                       style={{fontSize: '30px', wordBreak: 'break-all'}}>
                        {user.display_name}
                    </a>
                    {numOfReviews !== undefined && numOfReviews !== null ?
                        <p style={{margin: 0}}><span style={{fontWeight: 'bold'}}>{numOfReviews}</span> reviews</p>
                        :
                        <p style={{margin: 0}}><span style={{fontWeight: 'bold'}}>Loading</span> reviews</p>
                    }
                </div>
            </div>
        </div>
    )
}

export default UserDetails;