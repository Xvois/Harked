import React, { useContext } from 'react';
import { ProfileContext } from './ProfileContext';


export const ProfileContent = () => {
  const { /* state variables go here */ } = useContext(ProfileContext);

  // Use the state variables to render the content

  return (
    <div className='wrapper'>
      <TopContainer /* props go here */ />
      <SimpleWrapper /* props go here */ />
      {/* Other components go here */}
    </div>
  );
};