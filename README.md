# Colouring

A colouring app for the kids' iPads. It's one file, `index.html`, with no build step.

- 10 built-in pictures to colour, a blank page, or "Add your own picture" (a photo of a colouring sheet is turned into line art).
- Pencil, marker, spray and rubber. Tap a tool twice for the 30-colour picker.
- 30 picture spaces on the main page. "Tidy up" moves pictures into the grown-ups' vault (60 spaces, behind a sum) or deletes them.
- "Save to device" shares or downloads a PNG.

## Where pictures are stored

| Setup | Pictures live in |
|---|---|
| No Firebase config (default) | Each device's own browser storage. Not shared between iPads. |
| Firebase config filled in at the top of `index.html` | A Firestore database, shared live across every device that opens the page. |

Pictures drawn in the Claude artifact version don't carry over. Use "Save to device" there on any you want to keep.

## Hosting on GitHub Pages

1. Create an empty public repo called `colouring` on github.com (no README, no licence).
2. From this folder:
   ```bash
   git remote add origin https://github.com/StephenM754/colouring.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, Save.
4. After a minute or two the app is at `https://stephenm754.github.io/colouring/`.
5. On each iPad, open that URL in Safari, then **Share → Add to Home Screen** so it opens full screen like an app.

## Sharing pictures across iPads (optional, free)

Firebase's free Spark plan is plenty for this: Firestore allows 1 GiB stored and 50k reads / 20k writes a day. Each saved picture is roughly 100–250 KB.

1. Go to <https://console.firebase.google.com>, **Create a project** (e.g. `colouring`). Google Analytics can be turned off.
2. **Build → Firestore Database → Create database**. Pick a location near you (e.g. `eur3` or `europe-west2`) and start in **production mode**.
3. Open the **Rules** tab, replace the contents with the rules below, and **Publish**.
4. **Project settings (gear) → General → Your apps → Web (`</>`)**. Register an app (nickname `colouring`, no Hosting). Firebase shows a `firebaseConfig` object.
5. Copy `apiKey`, `authDomain`, `projectId` and `appId` into `window.FIREBASE_CONFIG` near the top of `index.html`.
6. Commit and push. Reload the page on each iPad; the main page should say "shared with everyone".

### Firestore rules

The app has no sign-in, so anyone who has the page URL can read and change pictures. These rules limit writes to the two collections the app uses and cap each document's size:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /thumbs/{id} {
      allow read: if true;
      allow delete: if true;
      allow write: if request.resource.data.keys().hasOnly(['img', 'updated', 'by'])
                   && request.resource.data.img is string
                   && request.resource.data.img.size() < 120000;
    }
    match /pictures/{id} {
      allow read: if true;
      allow delete: if true;
      allow write: if request.resource.data.keys().hasOnly(['img', 'tpl', 'lines'])
                   && request.resource.data.img is string
                   && request.resource.data.img.size() < 400000;
    }
  }
}
```

The Firebase web `apiKey` is not a secret; it only identifies the project. The rules above are what protect the data.

## Changing the app

Edit `index.html`, open it in a browser to check, then commit and push. Pages redeploys in about a minute.
