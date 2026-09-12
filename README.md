# Downloaders

This repository hosts a static GitHub Pages interface for uploading assets to the public [`downloads` release](https://github.com/jrb3ss0/downloaders/releases/tag/downloads).

## Uploading assets

Open the published GitHub Pages site, create a fine-grained GitHub personal access token restricted to this repository with **Contents: Read and write**, paste it into the page, select one or more files, and choose **Upload files and create links**. The page sends the upload through the `downloaders-custom-download` Worker because GitHub's release-upload endpoint does not permit browser cross-origin uploads. The Worker forwards the file and authorization header directly to GitHub and presents the original `browser_download_url` for each file.

The access token is used only while the upload request runs. The page does not save it in the repository, local storage, or cookies, and the Worker does not store it.

## Custom download links

Each release asset can also have a custom download link. The link is served by the `downloaders-custom-download` Cloudflare Worker, which streams the public GitHub release asset while setting a chosen download filename. The original extension is always retained. The user can optionally add 1–20 random digits to the filename; fresh digits are generated each time the link is visited.

For example, a stored asset named `build.zip` can download as `my-app.zip`, or as `my-app12345.zip` with different five-digit suffixes for different visits. The original GitHub asset is not renamed or duplicated.

## Security

The repository is public so download links are accessible to everyone. Use a fine-grained token restricted to this repository only, and revoke it in GitHub when you no longer need to upload files.
