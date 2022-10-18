import React from 'react'

const constructGraph = (object, x, y) => {
  object.forEach(element => {
    console.log(element[x] + " " + element[y]);
  });
  return (
    <h1>HELLO</h1>
  )
}

export default constructGraph