import React, { useState } from "react";
import { createGroup } from "../utils/api";

const GroupCreate = () => {
  const [groupName, setGroupName] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const handleCreateGroup = async () => {
    try {
      const response = await createGroup({ name: groupName, createdBy });
      alert(`Group Created: ${response.data.name}`);
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    }
  };

  return (
    <div>
      <h2>Create Group</h2>
      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Created By"
        value={createdBy}
        onChange={(e) => setCreatedBy(e.target.value)}
      />
      <button onClick={handleCreateGroup}>Create Group</button>
    </div>
  );
};

export default GroupCreate;