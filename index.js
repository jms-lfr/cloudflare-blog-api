addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

class FieldError extends Error{
  constructor(message){
    super(message);
    this.name = "FieldError";
  }
}

async function updatePosts(request){
  let body;
  try{
    body = await request.json();
  } catch(err) {
    return new Response("Invalid Syntax. Parameters should be in json format.", { status: 400 })
  }
  //console.log(body);
  try{
    //JSON.parse(body);
    title = body[0].title;
    username = body[0].username;
    content = body[0].content;
    if(!(title && username && content))
    {
      throw new FieldError("Missing field");
    }

    const postCount = parseInt(await KV.get("postCount"));
    body[0].id = postCount + 1;
    await KV.put("postCount", postCount + 1);

    body[0].date = new Date();

    data = JSON.parse(await KV.get("posts"));
    data.push(body);
    await KV.put("posts", JSON.stringify(data));

    return new Response("success", { status: 200 })
  } catch (err) {
    console.log(err.name);
    if(err instanceof FieldError){
      return new Response("Missing Field(s) (Required fields: title, username, content)", { status: 400 })
    }
    return new Response(err, { status: 500 })
  }
}

async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  //const postCount = await KV.get("postCount");
  const headers = {
        'Access-Control-Allow_Origin': '*',
        'Content-Type': 'application/json'
    }
  /*const defaultPosts = [
    {
      title: "First post",
      username: "coolguy123",
      content: "Hello world!",
      date: new Date("2021-12-29"),
      id: 1
    }
  ]*/
  //await KV.put("posts", JSON.stringify(defaultPosts));

  if( (pathname == "/api/posts") || pathname.startsWith("/api/posts/")){
    if(request.method == "POST"){
      return updatePosts(request);
    } else if(request.method == "GET"){
        if ( (pathname == "/api/posts") || (pathname == "/api/posts/") ){
            return new Response(await KV.get("posts"), { headers });
        }
        try{
            posts = JSON.parse(await KV.get("posts"));
            postID = parseInt(pathname.slice(11, pathname.length));
            content = JSON.stringify(posts.find(post => post.id.toString() === postID.toString()));
            if(content.length == 0)
            {
                return new Response("Post does not exist.", {status: 404});
            }
            return new Response(content, { headers });
        } catch (err) {
            return new Response("Post does not exist.", {status: 404});
        }
    } else if(request.method == "DELETE") 
    {
      return new Response("Method Not Allowed.", { status: 405 })
    } else {
      return new Response("Not Implemented", { status: 501 })
    }
  } else {
    return new Response("Not found", { status: 404 })
  }

  /*if (pathname.startsWith("/status")) {
    const httpStatusCode = Number(pathname.split("/")[2]);

    return Number.isInteger(httpStatusCode)
      ? fetch("https://http.cat/" + httpStatusCode)
      : new Response("That's not a valid HTTP status code.");
  }

  return new Response(`Amount of posts: ${postCount}`);*/
}