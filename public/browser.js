let skip = 0;
window.onLoad = generateTodos();
function generateTodos(){
    axios
    .get(`/read-item?skip=${skip}`)
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      const todos = res.data.data;

      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        todos
          .map((item) => {
            return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
        <span class="item-text"> ${item.todo}</span>
        <div>
        <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
        <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
        </div></li>`;
          })
          .join("")
      );

      skip += todos.length;
      return;
    })
    .catch((err) => {
      console.log(err);
      alert(err.message);
      return;
    });
}

document.addEventListener('click',(event)=>{
  if(event.target.classList.contains("edit-me")){

    const id = event.target.getAttribute('data-id');
    console.log(id);
    const newText = prompt("Enter new Todo Text");
    console.log(newText);

    axios.post('/edit-item',{id,newText})
    .then((res)=>{

        console.log(res);

       if(res.data.status !== 200){
         alert(res.data.message);
         return;
       }

      //  console.log("This section: "+event.target.parentElement.parentElement.querySelector(".item-text").innerHTML);
       event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newText;
 
    })
    .catch((err)=>{
      console.log(err);
    })
  }
  else if(event.target.classList.contains("delete-me")){
    const id = event.target.getAttribute('data-id');
    console.log(id);
    axios.delete("/delete-item",{data : { id }})
    .then((res)=>{

       if(res.data.status !== 200){
         alert(res.data.message);
         return;
       }

       console.log(res);
       event.target.parentElement.parentElement.remove();
 
    })
    .catch((err)=>{
      console.log(err);
    })
  }
  else if(event.target.classList.contains("add_item")){
    const todo = document.getElementById("create_field").value;

    axios.post('/create-item',{todo})
    .then((res)=>{

      if(res.data.status !== 201){
        alert(res.data.message);
        return;
      }
      
      document.getElementById("create_field").value = "";
      console.log(res);

      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
              <span class="item-text"> ${res.data.data.todo}</span>
              <div>
              <button data-id="${res.data.data._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
              <button data-id="${res.data.data._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
              </div></li>`
      );
    })
    .catch((err)=>{
      console.log(err);
    })
  }
  else if(event.target.classList.contains("show-more")){
    generateTodos();
  }
})
