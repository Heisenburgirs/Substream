import { Card, Typography } from "@material-tailwind/react";

interface ManageProps {
    rows: {
        name: string;
        id: string;
        subscription: boolean;  // Assuming subscription is a boolean
        action: string;
    }[];
}

const TABLE_HEAD = ["Name", "ID", "Subscription", "Action"];
 
export const Manage: React.FC<ManageProps> = ({ rows }) => {
  return (
    <div className="h-full w-full shadow-md rounded-15">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head) => (
              <th
                key={head}
                className="border-b border-[#d9d9d9]  bg-blue-gray-50 p-4"
              >
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="text-black font-bold leading-none"
                >
                  {head}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
			{rows.map(row => (
				<tr key={row.id}>
					<td className="p-4">
						<Typography
							variant="small"
							color="blue-gray"
							className="font-normal"
						>
							{row.name}
						</Typography>
					</td>
					<td className="p-4">
						<Typography
							variant="small"
							color="blue-gray"
							className="font-normal"
						>
							{row.id}
						</Typography>
					</td>
					<td className="p-4">
						<Typography
							variant="small"
							color="blue-gray"
							className="font-normal"
						>
							{row.subscription ? "Subscribed" : "Not Subscribed"}
						</Typography>
					</td>
					<td className="p-4">
						<Typography
							variant="small"
							color="blue-gray"
							className="font-normal"
						>
							{row.action}
						</Typography>
					</td>
				</tr>
			))}
		</tbody>
      </table>
    </div>
  );
}