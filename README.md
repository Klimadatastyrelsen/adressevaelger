# Adressevælger

A UI component for implementing Adressevælger (Address chooser) search in Javascript applications.

Current stable version is `5.0.1`. See [the Changelog.](./CHANGELOG.md)

# Quick start

The ready-to-use files are available in the dist/ folder in the repository:

adressevaelger.css
adressevaelger.iife.js

You can use them directly in your HTML without any build tools.

Find the files here:
https://github.com/SDFIdk/adressevaelger/tree/main/dist

Copy this example into a .html file to quickly test the component:

```html
<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href"./adressevaelger.css" />
        <script src="./adressevaelger.iife.js"></script>
    </head>
    <body>
        <label for="adressevaelger-input">Søg efter adresser</label>
        <div class="autocomplete-container">
            <input type="search" id="adressevaelger-input" />
        </div>

        <script>
            adressevaelger.adressevaelger(document.getElementById("adressevaelger-input"), {
                select: function (selected) {
                    console.log("Selected address:", selected);
                },
                token: "adressevaelger123",
            });
        </script>
    </body>
</html>
```

## Implementing Adressevaelger

To implement Adressevaelger, [check the implementation guide.](./GUIDE.md)

To migrate from dawa-autocomplete2, [check the migration guide.](./MIGRATION-GUIDE.md)


## Distribution

Adressevaelger is distributed only via this GitHub repository.

It is not available via CDN or npm, and must be included in projects by downloading or copying the required files from the repository.
