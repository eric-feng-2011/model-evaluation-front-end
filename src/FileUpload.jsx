import React from 'react';
import ReactDOM from 'react-dom';

const e = React.createElement;

export default class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        liked: false
    };

    // File interaction
    this.fileInput = React.createRef();
    this.tryUpload = this.tryUpload.bind(this);
  }

  tryUpload(event) {
    // Get the fetch parameters
    const file = event.target.files[0];
    const url = 'https://8lpjooicaf.execute-api.us-west-2.amazonaws.com/prod' + '/ride';

    console.log("Update!");

    fetch(url, {
        method: 'POST',
        body: file
      })
    .then(response => {
      if (response.ok) {
        response.json().then(json => {
          // Response is json array, and we want the first value
          console.log(json[0]);
        });
      }
    });
  }

  render() {
    if (this.state.liked) {
      return "File Uploaded!";
    }

    return (
      <form>
          <input type="file" name="file" accept="image/*"
              ref={this.fileInputRef}
              onChange={this.tryUpload}
          />
      </form>
    );
  }
}

// const domContainer = document.querySelector('#like_button_container');
// ReactDOM.render(e(LikeButton), domContainer);