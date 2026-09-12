# Downloaders

This repository hosts a static GitHub Pages interface for uploading assets to the public [`downloads` release](https://github.com/jrb3ss0/downloaders/releases/tag/downloads).

## Using the uploader

Open the published GitHub Pages site, create a fine-grained GitHub personal access token restricted to this repository with **Contents: Read and write**, paste it into the page, select one or more files, and choose **Upload files and create links**. The page uploads the files directly to GitHub and presents each `browser_download_url` for copying and sharing.

The access token is used only in the current browser page while the upload request runs. The site does not save it in the repository, local storage, or cookies.

## Security

The repository is public so download links are accessible to everyone. Use a fine-grained token restricted to this repository only, and revoke it in GitHub when you no longer need to upload files.
