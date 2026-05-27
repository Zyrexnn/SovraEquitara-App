cd c:\Users\ikhsa\Documents\SovraEquitara\aplikasi

git add package.json package-lock.json app.json babel.config.js metro.config.js tsconfig.json .gitignore
git commit -m "chore: initial expo setup and dependencies"

git add tailwind.config.js src/global.css
git commit -m "feat: integrate nativewind and global css"

git add src/components/ui/ src/constants/
git commit -m "feat: implement ui components and design system"

git add src/api/ src/store/
git commit -m "feat: add api client and state management"

git add src/app/(auth)/
git commit -m "feat: implement authentication screens"

git add src/app/_layout.tsx src/app/+not-found.tsx
git add src/app/(tabs)/_layout.tsx src/app/(tabs)/index.tsx src/app/(tabs)/profile.tsx
git commit -m "feat: setup tab navigation and core dashboard"

git add src/app/(tabs)/create-report.tsx src/app/(tabs)/map.tsx src/app/(tabs)/reports/
git commit -m "feat: implement report submission and detail screens"

git add src/app/feed.tsx src/app/my-reports.tsx
git commit -m "feat: add public feed and user reports history"

git add .
git commit -m "chore: add assets and final configuration"

git remote add origin https://github.com/Zyrexnn/SovraEquitara-App.git
git push -u origin master
