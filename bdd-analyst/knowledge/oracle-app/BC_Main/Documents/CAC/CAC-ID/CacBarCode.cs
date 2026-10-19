using System;
using System.Collections.Generic;
using System.Text;

namespace TheaterBlood.Scanning
{
	public class CacBarCode
	{
		public string BarCodeVersionCode { get; set; }
		public string PersonDesignatorId { get; set; }
		public string PdiTypeCode { get; set; }
		public string DodEdiPin { get; set; }               //For M type this "Dod EDI Persion Identifer		
		public string DodBenefitsNumber { get; set; }       //New for M type
		public string FirstName { get; set; }
		public string MiddleInitial { get; set; }
		public string SurName { get; set; }
		public DateTime DateOfBirth { get; set; }
		public string CountryOfCitizenship { get; set; }    //2 Character ISO Country Code.  Will update to 3-char in the future
		public string PersonnelCategoryCode { get; set; }
		public string BranchCode { get; set; }
		public string PersonnelEntitlementConditionType { get; set; }
		public string Rank { get; set; }
		public string PayPlanCode { get; set; }
		public string PayPlanGradeCode { get; set; }
		public DateTime CardIssueDate { get; set; }
		public DateTime CardExpirtationDate { get; set; }
		public string CardInstanceIdentifier { get; set; }
		public string Nationality { get; set; }
		public string UniqueCardId { get; set; }
		public int BranchCodeInt => BranchLetterToTmdsBranchCode(BranchCode);

		public CacBarCode(string rawString)
		{
			rawString = rawString.Trim();
			if (rawString.Length != 88 && rawString.Length != 89 && rawString.Length != 18 && rawString.Length != 99)
			{
				throw new ArgumentException("Valid CAC bard codes are 88, 89, 99 characters long or the 1D style is 18 characters long", "rawString");
			}
			Parse(rawString);
		}

		private void Parse(string rawString)
		{
			if (rawString.Substring(0, 1).Equals("1"))
				Parse1Type(rawString);
			else if (rawString.Substring(0, 1).Equals("N"))
				ParseNType(rawString);
			else if (rawString.Substring(0, 1).Equals("M"))
				ParseMType(rawString);
		}

		private void Parse1Type(string rawString)
		{
			var pos = 0;
			var _BarCodeVersionCode = rawString.Substring(pos, 1);
			pos += 1;
			var _PersonDesignatorId = rawString.Substring(pos, 6);
			pos += 6;
			var _PdiTypeCode = rawString.Substring(pos, 1);
			pos += 1;
			var _DodEdiPin = rawString.Substring(pos, 7);
			pos += 7;
			var _PersonnelCategoryCode = rawString.Substring(pos, 1);
			pos += 1;
			var _BranchCode = rawString.Substring(pos, 1);
			pos += 1;
			var _CardInstanceIdentifier = rawString.Substring(pos, 1);

			BarCodeVersionCode = _BarCodeVersionCode;
			PersonDesignatorId = Base32ToLong(_PersonDesignatorId).ToString();
			PdiTypeCode = _PdiTypeCode;
			DodEdiPin = Base32ToLong(_DodEdiPin).ToString();
			PersonnelCategoryCode = _PersonnelCategoryCode;
			BranchCode = _BranchCode;
			CardInstanceIdentifier = _CardInstanceIdentifier;
			SetNationality();
		}

		private void ParseNType(string rawString)
		{
			var pos = 0;
			var barCodeVersionCode = rawString.Substring(pos, 1);
			pos += 1;
			var personDesignatorId = rawString.Substring(pos, 6);
			pos += 6;
			var pdiTypeCode = rawString.Substring(pos, 1);
			pos += 1;
			var dodEdiPin = rawString.Substring(pos, 7);
			pos += 7;
			var firstName = rawString.Substring(pos, 20);
			pos += 20;
			var surName = rawString.Substring(pos, 26);
			pos += 26;
			var dateOfBirth = rawString.Substring(pos, 4);
			pos += 4;
			var personnelCategoryCode = rawString.Substring(pos, 1);
			pos += 1;
			var branchCode = rawString.Substring(pos, 1);
			pos += 1;
			var personnelEntitlementConditionType = rawString.Substring(pos, 2);
			pos += 2;
			var rank = rawString.Substring(pos, 6);
			pos += 6;
			var payPlanCode = rawString.Substring(pos, 2);
			pos += 2;
			var payPlanGradeCode = rawString.Substring(pos, 2);
			pos += 2;
			var cardIssueDate = rawString.Substring(pos, 4);
			pos += 4;
			var cardExpirtationDate = rawString.Substring(pos, 4);
			pos += 4;
			var cardInstanceIdentifier = rawString.Substring(pos, 1);
			pos += 1;
			var middleInitial = string.Empty;
			if (rawString.Length > pos)
			{
				middleInitial = rawString.Substring(pos, 1);
			}
			BarCodeVersionCode = barCodeVersionCode;
			PersonDesignatorId = Base32ToLong(personDesignatorId).ToString();
			PdiTypeCode = pdiTypeCode;
			DodEdiPin = Base32ToLong(dodEdiPin).ToString();
			FirstName = firstName.Trim();
			SurName = surName.Trim();
			DateOfBirth = Base32To1Jan1000BaseDate(dateOfBirth);
			PersonnelCategoryCode = personnelCategoryCode;
			BranchCode = branchCode;
			PersonnelEntitlementConditionType = personnelEntitlementConditionType;
			Rank = rank.Trim();
			PayPlanCode = payPlanCode;
			PayPlanGradeCode = payPlanGradeCode;
			CardIssueDate = Base32To1Jan1000BaseDate(cardIssueDate);
			CardExpirtationDate = Base32To1Jan1000BaseDate(cardExpirtationDate);
			CardInstanceIdentifier = cardInstanceIdentifier;
			MiddleInitial = middleInitial;

			SetNationality();
		}

		private void ParseMType(string rawString)
		{
			var pos = 0;
			var barCodeVersionCode = rawString.Substring(pos, 1);
			pos += 1;
			var dodEdiPin = rawString.Substring(pos, 7);
			pos += 7;
			var dodBenefitsNumber = rawString.Substring(pos, 8);
			pos += 8;
			var firstName = rawString.Substring(pos, 20);
			pos += 20;
			var middleInitial = rawString.Substring(pos, 1);
			pos += 1;
			var surName = rawString.Substring(pos, 26);
			pos += 26;
			var dateOfBirth = rawString.Substring(pos, 4);
			pos += 4;
			var countryOfCitizenship = rawString.Substring(pos, 3);
			pos += 3;
			var personnelCategoryCode = rawString.Substring(pos, 1);
			pos += 1;
			var branchCode = rawString.Substring(pos, 1);
			pos += 1;
			var personnelEntitlementConditionType = rawString.Substring(pos, 2);
			pos += 2;
			var rank = rawString.Substring(pos, 6);
			pos += 6;
			var payPlanCode = rawString.Substring(pos, 2);
			pos += 2;
			var payPlanGradeCode = rawString.Substring(pos, 2);
			pos += 2;
			var cardInstanceIdentifier = rawString.Substring(pos, 1);
			pos += 1;
			var cardIssueDate = rawString.Substring(pos, 4);
			pos += 4;
			var cardExpirtationDate = rawString.Substring(pos, 4);
			pos += 4;
			var uniqueCardId = rawString.Substring(pos, 6);

			BarCodeVersionCode = barCodeVersionCode;

			DodEdiPin = Base32ToLong(dodEdiPin).ToString();
			FirstName = firstName.Trim();
			SurName = surName.Trim();
			DateOfBirth = Base32To1Jan1000BaseDate(dateOfBirth);
			PersonnelCategoryCode = personnelCategoryCode;
			BranchCode = branchCode;
			PersonnelEntitlementConditionType = personnelEntitlementConditionType;
			Rank = rank.Trim();
			PayPlanCode = payPlanCode;
			PayPlanGradeCode = payPlanGradeCode;
			CardIssueDate = Base32To1Jan1000BaseDate(cardIssueDate);
			CardExpirtationDate = Base32To1Jan1000BaseDate(cardExpirtationDate);
			CardInstanceIdentifier = cardInstanceIdentifier;
			MiddleInitial = middleInitial;
			DodBenefitsNumber = dodBenefitsNumber;
			CountryOfCitizenship = countryOfCitizenship;
			UniqueCardId = uniqueCardId;

			SetNationality();
		}
		private void SetNationality()
		{
			switch (BranchCode.ToUpper())
			{
				case "A":
				case "C":
				case "D":
				case "F":
				case "H":
				case "M":
				case "N":
				case "O":
					//United States of America
					Nationality = "1";
					break;
				default:
					Nationality = string.Empty;
					break;
			}
		}

		private long Base32ToLong(string base32NumberString)
		{
			var base32 = new char[] {
				'0','1' ,'2', '3','4' ,'5', '6','7' ,
				'8','9' ,'a', 'b','c' ,'d', 'e','f' ,
				'g','h' ,'i', 'j','k' ,'l', 'm','n' ,
				'o','p' ,'q', 'r','s' ,'t', 'u','v'
				};
			long n = 0;
			foreach (var d in base32NumberString.ToLowerInvariant())
			{
				n = n << 5;
				var idx = Array.IndexOf(base32, d);
				if (idx == -1)
					throw new CacCardException("Provided number contains invalid characters");
				n += idx;
			}
			return n;
		}

		private static int BranchLetterToTmdsBranchCode(string branchCode) //This should be pulled from the data model
		{
			var map = new Dictionary<string, int>()
			{
				{"A", 10},
				{"C", 15},
				{"D", 3},
				{"F", 11},
				{"H", 21},
				{"M", 17},
				{"N", 19},
				{"O", 7},
				{"1", 4},
				{"2", 4},
				{"3", 4},
				{"4", 4},
				{"X", 8}
			};

			return map[branchCode];
		}

		private DateTime Base32To1Jan1000BaseDate(string base32DateString)
		{
			var daysSinceJan1000 = Base32ToLong(base32DateString);
			var returnDate = new DateTime(1000, 1, 1);
			returnDate = returnDate.AddDays(daysSinceJan1000);
			return returnDate;
		}

		public override string ToString()
		{
			var sb = new StringBuilder();
			sb.Append("BarCodeVersionCode: ").Append(BarCodeVersionCode).Append(Environment.NewLine);
			sb.Append("PersonDesignatorId: ").Append(PersonDesignatorId).Append(Environment.NewLine);
			sb.Append("PdiTypeCode: ").Append(PdiTypeCode).Append(Environment.NewLine);
			sb.Append("DodEdiPin: ").Append(DodEdiPin).Append(Environment.NewLine);
			sb.Append("FirstName: ").Append(FirstName).Append(Environment.NewLine);
			sb.Append("MiddleInitial: ").Append(MiddleInitial).Append(Environment.NewLine);
			sb.Append("SurName: ").Append(SurName).Append(Environment.NewLine);
			sb.Append("DateOfBirth: ").Append(DateOfBirth).Append(Environment.NewLine);
			sb.Append("PersonnelCategoryCode: ").Append(PersonnelCategoryCode).Append(Environment.NewLine);
			sb.Append("BranchCode: ").Append(BranchCode).Append(Environment.NewLine);
			sb.Append("PersonnelEntitlementConditionType: ").Append(PersonnelEntitlementConditionType).Append(Environment.NewLine);
			sb.Append("Rank: ").Append(Rank).Append(Environment.NewLine);
			sb.Append("PayPlanCode: ").Append(PayPlanCode).Append(Environment.NewLine);
			sb.Append("PayPlanGradeCode: ").Append(PayPlanGradeCode).Append(Environment.NewLine);
			sb.Append("CardIssueDate: ").Append(CardIssueDate).Append(Environment.NewLine);
			sb.Append("CardExpirtationDate: ").Append(CardExpirtationDate).Append(Environment.NewLine);
			sb.Append("CardInstanceIdentifier: ").Append(CardInstanceIdentifier).Append(Environment.NewLine);
			sb.Append("Nationality: ").Append(Nationality).Append(Environment.NewLine);
			return sb.ToString();
		}
	}


	[Serializable]
	public class CacCardException : Exception
	{
		public CacCardException() { }
		public CacCardException(string message) : base(message) { }
		public CacCardException(string message, Exception inner) : base(message, inner) { }
		protected CacCardException(
		  System.Runtime.Serialization.SerializationInfo info,
		  System.Runtime.Serialization.StreamingContext context) : base(info, context) { }
	}

}
