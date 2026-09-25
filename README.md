# Number Garden

A small browser app for exploring place value, regrouping, subtraction, and addition. It has no backend or build step.

Open `index.html` in a modern browser to use it. The builder supports numbers from 0 to 999, opening whole hundreds and tens, and grouping ten lower units back into one higher unit. Take Away and Put Together each show two operand rows and a third answer row. In the answer row, add individual dots, group 10 dots into a ten in the Ones place, then drag or tap that ten into Tens. Group 10 tens in Tens to make a hundred-circle, then drag or tap it into Hundreds.

All quantities live in `app.js` as counts of hundreds, tens, and ones, with a pending group while it is being moved between columns. Regrouping and moving preserve the represented value; adding or taking away units changes the value intentionally.
