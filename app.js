const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set("view engine", "ejs");

const router = express.Router();
app.use(router);
app.use((req, res) => {
    res.render("notfound"); // To handle page not found error.
});


let posts = [];

router.get("/", (req, res) => {

    // Add route for each post.
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const title = post.title;
        const text = post.text;
        const id = post.id;
        const postURL = post.postURL;

        // Create a new route for that URL.
        router.get(postURL, (requestPost, responsePost) => {
            responsePost.render("post", { title, text, id });
        });
    }

    res.render("index", { posts });

    // put the response function inside the new post object, and when a new one is made, change it.
    // Instead of router.get..., const function = post.function, function();
    
});
router.get("/about", (req, res) => {
    res.render("about");
});
router.get("/contact", (req, res) => {
    res.render("contact");
});
router.get("/compose", (req, res) => {
    res.render("compose", { duplicateTitle: null, enteredText: null, invalidClass: null, ariaDescribe: null });
});

router.post("/compose", (req, res) => {

    const postTitle = req.body.title;
    const postText = req.body.text;

    // Check for duplicate title.
    let duplicate = false;
    for (let i = 0; i < posts.length; i ++) {
        const post = posts[i];
        if ((post.title).toLowerCase() === postTitle.toLowerCase()) {
            duplicate = true;
            break;
        }
    }

    // If we have a duplicate, render the page with the necesary headers to show this.
    if (duplicate) {
        res.render("compose", { duplicateTitle: postTitle, enteredText: postText, invalidClass: 'is-invalid', ariaDescribe: 'invalidFeedback' });
    } else {
        const newPost = {
            title: postTitle,
            text: postText,
            id: (Math.floor(100000 + Math.random() * 900000)).toString(), // Random 6 digit number as a string.
            cutText: truncateTo100Chars(postText),
            postURL: "/" + formatNameToURL(postTitle),
        };
        posts.push(newPost);
    
        res.redirect("/");
    }
    
});
router.post("/edit", (req, res) => {

    const postID = req.body.post_id;
    
    const correspondingPost = posts.find((post) => {
        return post.id === postID;
    });
    const title = correspondingPost.title;
    const text = correspondingPost.text;

    res.render("edit", { title, old_title: title, text, id: postID, invalidClass: null, ariaDescribe: null });
});
router.post("/update", (req, res) => {

    const newTitle = req.body.title;
    const newText = req.body.text;
    const postID = req.body.id;

    // Check for duplicate
    const currentlyEditing = req.body.old_title; // The title of the post that was being edited before the title possibly changed.
    
    let duplicate = false;
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // If we're editing that post and the title is the same, that just means that only the body text was changed and we didn't change the title.
        if ((post.title).toLowerCase() === newTitle.toLowerCase() && (post.title).toLowerCase() !== currentlyEditing.toLowerCase()) { // If the post's title is equal to the entered title & it is NOT the one that we are editing.
            duplicate = true;
            break;
        }
    }

    // If we have a duplicate, render the page with the necesary headers to show this.
    if (duplicate) {
        res.render("edit", { title: newTitle, old_title: currentlyEditing, text: newText, id: postID, invalidClass: 'is-invalid', ariaDescribe: 'invalidFeedback',   });
    } else {
        posts.forEach((post) => {
            // If we find a post with the same ID, change it's contents to the new ones.
            if (post.id === postID) {
                post.title = newTitle;
                post.text = newText;
                post.cutText = truncateTo100Chars(newText);
    
                // Remove the old URL route from the router stack.
                router.stack = router.stack.filter((route) => { 
                    const path = route.route.path;
                    // Filtering the router stack by each route whose path is NOT equal to the url. This will return the route stack WITHOUT the specified route, thus removing it.
                    return path !== post.postURL;
                });
                // Add the new URL.
                post.postURL = "/" + formatNameToURL(newTitle);
            }
        });
    
        // Redirect home.
        res.redirect("/");
    }
});
router.post("/delete", (req, res) => {
    
    // Get the ID & URL of the post to delete
    const postID = req.body.post_id;
    const postURL = req.body.post_url;

    // Set the posts array equal to itself WITHOUT that post.
    posts = posts.filter((post) => {
        return post.id !== postID
    });
    // Remove the route for that post's URL.
    router.stack = router.stack.filter((route) => {
        const path = route.route.path;
        return path !== postURL;
    });

    res.redirect("/");
});


function formatNameToURL(name) {
    const split = name.split(" "); // Split by every space.
    const joined = split.join("-"); // Join it by a dash.

    return joined.toLowerCase(); // Adding a backslash and lowercasing the name.
};
function truncateTo100Chars(string) {
    const hundred_chars = string.substr(0, 100); // Taking the substring that includes only the characters from 0 - 100.
    // If the length of the string is 100 or greater, add the ellipsis, else just leave the string.
    if (hundred_chars.length >= 100) {
        return hundred_chars + "...";
    } else {
        return hundred_chars;
    }
}


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}.`));
