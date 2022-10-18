import React from 'react'
import './Graph.css';

const constructGraph = (object, x, y, key) => {
  console.log(object)
  const coordinates = [];
  object.forEach(element => { coordinates.push([element[x], element[y], element[key]]) });
  console.log(coordinates)
  const maxX = Math.max(coordinates[x]);
  const maxY = Math.max(coordinates[y]);
  const rangeX = maxX - Math.min(coordinates[x]);
  const rangeY = maxY - Math.min(coordinates[y]);
  const points = coordinates.map((coordinate) => 
    <div className='point' key={coordinate[2]} style={{left: `${coordinate[0]}px`, top: `${coordinate[1]}px`}}></div>
  )
  return (
    <div className='point-container'>
      {points}
    </div>
  )
}

export default constructGraph