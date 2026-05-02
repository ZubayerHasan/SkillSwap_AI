import { useState } from "react";
import { createReview } from "../../api/reviewApi";

export default function ReviewForm({ userId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async () => {
    await createReview({
      reviewedUserId: userId,
      rating,
      comment,
    });

    alert("Review submitted!");
  };

  return (
    <div>
      <select onChange={(e) => setRating(Number(e.target.value))}>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>

      <input
        placeholder="comment"
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={submit}>Submit Review</button>
    </div>
  );
}