**How code works in brief:-**

  1)
- First of all it will read a file line by line using readLine function.
- Then lines are piled up into chunks until the size of the accumulated data exceeds a predefined chunk size (CHUNK_SIZE).
- Once a chunk reaches the maximum size, it's sorted in memory and written to a temporary file.

  2)
- After all chunks are created and sorted individually, they will be merged.
- The code defines a function mergeStreams to merge streams from multiple chunk files.
- Once all chunks are merged, temporary chunk files are deleted, and the merged chunk is renamed to the output file name.

  3)
- Then, `externalMergeSort` function orchestrates the sorting process.
- It reads the input file, divides it into sorted chunks, merges them iteratively until a single sorted chunk remains, and renames it to the output file.
