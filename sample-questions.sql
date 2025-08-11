-- 6 Simple Questions for Game Show
-- Copy and paste this into your database or use the import below

INSERT INTO "Question" (id, text, "answerCount", "isFinalRound") VALUES
('Q1', 'Name something people forget at home when going out', 8, false),
('Q2', 'Name a place where you need to keep quiet', 6, false),
('Q3', 'Name something you find in a kitchen', 10, false),
('Q4', 'Name a reason why someone might be late to work', 7, false),
('Q5', 'Name something people do when they are bored', 9, false),
('Q6', 'Name a popular social media platform', 5, false);

INSERT INTO "Answer" ("questionId", "index", "text", "value") VALUES
-- Q1 Answers
('Q1', 1, 'Keys', 1000),
('Q1', 2, 'Wallet', 1000),
('Q1', 3, 'Phone', 1000),
('Q1', 4, 'Umbrella', 1000),
('Q1', 5, 'Mask', 1000),
('Q1', 6, 'Glasses', 1000),
('Q1', 7, 'ID Card', 1000),
('Q1', 8, 'Charger', 1000),

-- Q2 Answers  
('Q2', 1, 'Library', 2000),
('Q2', 2, 'Temple', 2000),
('Q2', 3, 'Hospital', 2000),
('Q2', 4, 'Cinema', 2000),
('Q2', 5, 'Classroom', 2000),
('Q2', 6, 'Court', 2000),

-- Q3 Answers
('Q3', 1, 'Refrigerator', 1500),
('Q3', 2, 'Stove', 1500),
('Q3', 3, 'Microwave', 1500),
('Q3', 4, 'Dishes', 1500),
('Q3', 5, 'Knife', 1500),
('Q3', 6, 'Spoons', 1500),
('Q3', 7, 'Plates', 1500),
('Q3', 8, 'Toaster', 1500),
('Q3', 9, 'Blender', 1500),
('Q3', 10, 'Sink', 1500),

-- Q4 Answers
('Q4', 1, 'Traffic Jam', 3000),
('Q4', 2, 'Overslept', 3000),
('Q4', 3, 'Car Trouble', 3000),
('Q4', 4, 'Bad Weather', 3000),
('Q4', 5, 'Sick Child', 3000),
('Q4', 6, 'Train Delay', 3000),
('Q4', 7, 'Forgot Keys', 3000),

-- Q5 Answers
('Q5', 1, 'Watch TV', 500),
('Q5', 2, 'Read Book', 500),
('Q5', 3, 'Play Games', 500),
('Q5', 4, 'Listen Music', 500),
('Q5', 5, 'Social Media', 500),
('Q5', 6, 'Call Friends', 500),
('Q5', 7, 'Exercise', 500),
('Q5', 8, 'Cook', 500),
('Q5', 9, 'Sleep', 500),

-- Q6 Answers
('Q6', 1, 'Facebook', 4000),
('Q6', 2, 'Instagram', 4000),
('Q6', 3, 'Twitter', 4000),
('Q6', 4, 'WhatsApp', 4000),
('Q6', 5, 'YouTube', 4000);
